import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Prisma
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

// Interfaces
import { EFieldType, EPaginationMode, ESearchOptions } from 'src/interfaces';

// Utils
import { convertToNumber, deepMerge, TEnv } from 'src/utils';

@Injectable()
export class SearchService {
  constructor(
    private readonly configService: ConfigService<TEnv>,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(SearchService.name);
  private FETCH_LIMIT = this.configService.get('FETCH_LIMIT', { infer: true });
  private separator = '|';
  private mappingOptions = {
    eql: 'equals',
    not: 'not',
    ctn: 'contains',
    edw: 'endsWith',
    stw: 'startsWith',
    gt0: 'gt',
    gte: 'gte',
    lt0: 'lt',
    lte: 'lte',
  };
  private fieldRelations: {
    [key: string]: { type: string; options: ESearchOptions[] };
  } = {
    STRING: {
      type: 'string',
      options: [
        ESearchOptions.EQUAL,
        ESearchOptions.DIFFERENT,
        ESearchOptions.CONTAINS,

        ESearchOptions.ENDS_WITH,
        ESearchOptions.STARTS_WITH,

        ESearchOptions.GREATER_THAN,
        ESearchOptions.GREATER_OR_EQUAL_THAN,

        ESearchOptions.LOWER_THAN,
        ESearchOptions.LOWER_OR_EQUAL_THAN,
      ],
    },
    NUMBER: {
      type: 'number',
      options: [
        ESearchOptions.EQUAL,
        ESearchOptions.DIFFERENT,

        ESearchOptions.GREATER_THAN,
        ESearchOptions.GREATER_OR_EQUAL_THAN,

        ESearchOptions.LOWER_THAN,
        ESearchOptions.LOWER_OR_EQUAL_THAN,
      ],
    },
    DATE: {
      type: 'date',
      options: [
        ESearchOptions.EQUAL,
        ESearchOptions.DIFFERENT,

        ESearchOptions.GREATER_THAN,
        ESearchOptions.GREATER_OR_EQUAL_THAN,

        ESearchOptions.LOWER_THAN,
        ESearchOptions.LOWER_OR_EQUAL_THAN,
      ],
    },
    BOOLEAN: {
      type: 'boolean',
      options: [ESearchOptions.EQUAL, ESearchOptions.DIFFERENT],
    },
  };

  verifyFieldRelation(type: EFieldType, currentRelation: any, value: any) {
    const relation = this.fieldRelations[String(type).toUpperCase()];

    if (!relation) {
      return false;
    }

    if (!relation.options.includes(currentRelation)) {
      return false;
    }

    if (typeof value !== relation.type) {
      switch (relation.type) {
        case 'number':
          if (typeof convertToNumber(value) !== 'number') return false;
          break;
        case 'date':
          try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return false;
          } catch (err) {
            return false;
          }
          break;
        case 'boolean':
          if (!['true', 'false'].includes(value)) return false;
          break;
      }
    }

    return true;
  }

  processListQuery(query: { [key: string]: any }) {
    let cursor = undefined;
    const cursorKey = query.cursorKey || 'id';
    const cursorValue: string | undefined = query.cursor || undefined;

    let mode = EPaginationMode.OFFSET;

    if (cursorValue) {
      mode = EPaginationMode.CURSOR;
      if (cursorValue !== 'null') {
        cursor = {};
        cursor[cursorKey] = cursorValue;
      }
    }

    const page: number | undefined = Object.keys(query).includes('page')
      ? convertToNumber(query.page) || 0
      : 0;

    const take = this.verifyMaxSearch(query.take);

    const skip =
      mode === EPaginationMode.CURSOR && cursorValue !== 'null'
        ? 1
        : take * page;

    const orderByField = query.orderBy;
    const orderByDirection = Object.keys(query).includes('desc')
      ? 'desc'
      : 'asc';

    delete query['cursorKey'];
    delete query['cursor'];
    delete query['page'];
    delete query['take'];
    delete query['orderBy'];
    delete query['desc'];

    return {
      mode,
      cursor,
      cursorKey,
      cursorValue,
      page,
      take,
      skip,
      search: query,
      orderByField,
      orderByDirection,
    };
  }

  search(options: {
    mode: EPaginationMode;
    search?: Record<string, string>;
    orderByField?: string;
    orderByDirection?: string;
    sortFields?: string[];
    searchableFields?: Record<string, EFieldType>;
    merge?: Record<string, any>;
  }) {
    const searchableFields = options.searchableFields || {};
    const sortFields = options.sortFields || [];
    const where = {};
    const orderBy = {};

    Object.keys(options.search).forEach((key: string) => {
      const value = options.search[key];

      if (value.length < 5) {
        throw new HttpException(
          {
            message: 'ERR_INVALID_SEARCH_QUERY_CONFIG',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (value[3] !== this.separator) {
        return;
      }

      const relation = value.substring(0, 3) as ESearchOptions;
      const search = value.substring(4);

      if (key === 'search') {
        where['OR'] = [];
        Object.keys(searchableFields).forEach((keySearch: string) => {
          const verify = this.verifyFieldRelation(
            searchableFields[keySearch],
            relation,
            search,
          );

          if (verify) {
            const mappedKey = this.mappingOptions[relation];

            const v = {};
            v[keySearch] = {};
            v[keySearch][mappedKey] = search;

            where['OR'].push(v);
          }
        });
      } else {
        const verify = this.verifyFieldRelation(
          searchableFields[key],
          relation,
          search,
        );

        if (!verify) {
          throw new HttpException(
            {
              message: 'ERR_INVALID_SEARCH_QUERY_CONFIG',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        const mappedKey = this.mappingOptions[relation];

        where[key] = {};
        where[key][mappedKey] = search;
      }
    });

    if (
      options.orderByField &&
      sortFields.length &&
      sortFields.includes(options.orderByField)
    ) {
      orderBy[options.orderByField] = options.orderByDirection || 'asc';
    }

    const finalWhere = deepMerge(where, options.merge || {});
    const fullSearch = { where: finalWhere, orderBy };

    return {
      fullSearch,
      where: finalWhere,
      orderBy,
      searchableFields,
      sortFields,
    };
  }

  pagination(page: number, take: number, count: number) {
    const skip = take * page;

    let lastPage: number = 0;
    if (count && count > take) {
      lastPage = Math.trunc(count / take) + (count % take === 0 ? -1 : 0);
    }

    return { currentPage: page, lastPage, take, skip };
  }

  processError(err: any, origin: any, throwError = true) {
    this.logger.error(`ERROR ORIGIN: ${origin}`);
    this.logger.error(err);
    if (!throwError) {
      return;
    }
    if (err instanceof HttpException) {
      throw new HttpException(err.getResponse(), err.getStatus());
    } else if (err instanceof HttpException) {
      this.logger.error(`ERROR INSTANCE TYPE: HttpException`);
      throw new HttpException(err.getResponse(), err.getStatus());
    } else if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      throwError
    ) {
      this.logger.error(`ERROR INSTANCE TYPE: DBException`);
      this.prisma.DBErrorMessage(err);
    }
    throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Métodos Internos

  private verifyMaxSearch(take: number): number {
    const num = convertToNumber(take);
    if (!num || num > this.FETCH_LIMIT) return this.FETCH_LIMIT;
    return num;
  }
}
