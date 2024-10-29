import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { SearchService } from './search.service';
import { EFieldType, EPaginationMode } from 'src/interfaces';

@Injectable()
export class BaseHelperService {
  constructor(private readonly searchService: SearchService) {}

  async listing<
    Repository extends {
      findMany: (args: any) => Promise<any>;
      count: (args: any) => Promise<number>;
    },
    Fields,
    Where,
    Select,
    OrderBy,
  >(
    repo: Repository,
    query: any,
    config: {
      logger: Logger;
      origin: string;
      restrictPaginationToMode?: EPaginationMode;
      searchableFields: Partial<Record<keyof Fields, EFieldType>>;
      sortFields?: Array<keyof Fields>;
      orderByFields?: OrderBy;
      mergeWhere?: Where;
      select?: Select;
    },
    modify?: (content: any[]) => any[],
  ) {
    const {
      mode,
      cursor,
      cursorKey,
      skip,
      take,
      page,
      search,
      orderByField,
      orderByDirection,
    } = this.searchService.processListQuery(query);

    if (
      config.restrictPaginationToMode &&
      mode !== config.restrictPaginationToMode
    ) {
      throw new HttpException(
        {
          message: 'ERR_INVALID_PAGINATION_MODE',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { where, orderBy } = this.searchService.search({
      mode,
      search,
      orderByField,
      orderByDirection,
      searchableFields: config.searchableFields,
      sortFields: config.sortFields as string[],
      merge: config.mergeWhere,
    });

    let content = await repo.findMany({
      skip,
      take,
      where,
      orderBy,
      cursor,
      select: config.select,
    });

    // Verifica se deve aplicar uma função de modificação
    if (modify) {
      content = modify(content);
    }

    const current = content.length;

    if (mode === EPaginationMode.OFFSET) {
      const count = await repo.count({ where });

      const { currentPage, lastPage } = this.searchService.pagination(
        page,
        take,
        count,
      );

      config.logger.log(
        `Some "${config.origin}" were listed using offset-pagination mode`,
      );

      return {
        currentPage,
        lastPage,
        count,
        take,
        current,
        data: content,
      };
    }

    const nextCursor = cursor
      ? take === current // Verifica se a quantidade que elementos que queria se obtida é igual a retornada, se for então pode ser que haja uma próxima pagina por curso, se não, então é a última
        ? content[current - 1][cursorKey]
        : null
      : undefined;

    config.logger.log(
      `Some "${config.origin}" were listed using cursor-pagination mode`,
    );

    return {
      nextCursor,
      take,
      current,
      data: content,
    };
  }
}
