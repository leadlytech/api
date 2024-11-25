import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  EventService,
  CacheService,
  SearchService,
  BaseHelperService,
} from 'src/shared/services';

import { EFieldType, EPaginationMode, IProps, TList } from 'src/interfaces';
import {
  IDefault,
  origin,
  TCreateRequest,
  TFindRequest,
  TListRequest,
  TRemoveRequest,
  TUpdateRequest,
} from '../dto';
import { createRecordId } from 'src/utils';
import { EOriginRoutes } from 'src/routes';

@Injectable()
export class HelperService extends BaseHelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventService: EventService,
    private readonly cacheService: CacheService,
    searchService: SearchService,
  ) {
    super(searchService);
  }
  private origin = origin;
  private logger = new Logger(this.origin);
  private repository = this.prisma.funnel;

  async create(
    props: IProps,
    data: TCreateRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Creating a new "${this.origin}"`);
      const record = await this.repository.create({
        data: {
          id: createRecordId(),
          organizationId: data.organizationId,
          name: data.name,
          description: data.description,
        },
        select: {
          id: true,
        },
      });

      this.eventService.create(this.origin, record);
      this.logger.log(`New "${this.origin}" created (ID: ${record.id})`);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async list(
    props: IProps,
    data: TListRequest,
    restrictPaginationToMode?: EPaginationMode,
  ): Promise<TList<Partial<IDefault>>> {
    this.logger.log(`Listing "${this.origin}"`);
    try {
      type R = typeof this.repository;
      type F = R['fields'];
      type W = Parameters<R['findMany']>[0]['where'];
      type S = Parameters<R['findMany']>[0]['select'];
      type O = Parameters<R['findMany']>[0]['orderBy'];

      const listed = await this.listing<R, F, W, S, O>(this.repository, data, {
        logger: this.logger,
        origin: this.origin,
        restrictPaginationToMode,
        searchableFields: {
          id: EFieldType.STRING,
        },
        sortFields: ['id'],
        mergeWhere: {
          organization: {
            tenantId: props.tenantId,
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return listed;
    } catch (err) {
      throw err;
    }
  }

  async findOne(
    props: IProps,
    data: TFindRequest,
    renew = false,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Retrieving a single "${this.origin}"`);

      type R = typeof this.repository;
      type RType = NonNullable<Awaited<ReturnType<R['findUniqueOrThrow']>>>;
      let record: Partial<RType> = null;

      if (!renew) {
        record = await this.cacheService.get(this.origin, data.id);
      }

      if (!record) {
        record = await this.repository.findUniqueOrThrow({
          where: {
            id: data.id,
            organization: {
              tenantId: props.tenantId,
            },
          },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            Step: {
              select: {
                id: true,
                name: true,
                type: true,
                config: true,
                data: true,
              },
            },
            Edge: {
              select: {
                id: true,
                originId: true,
                destinyId: true,
              },
            },
          },
        });

        if (!renew) {
          await this.cacheService.set(this.origin, record.id, record);
        }
      }

      this.logger.log(`One "${this.origin}" was retrieved (ID: ${record.id})`);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async update(
    props: IProps,
    id: string,
    data: TUpdateRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Updating a "${this.origin}"`);
      const record = await this.repository.update({
        where: {
          id,
          organization: {
            tenantId: props.tenantId,
          },
        },
        data: {
          name: data.name,
          description: data.description,
        },
      });

      if (data.steps || data.edges) {
        await this.saveFunnelDetails(record.id, data.steps, data.edges);
      }

      this.eventService.update(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
      await this.cacheService.del(EOriginRoutes.FUNNELS_PUBLIC, record.id);
      this.logger.log(`One "${this.origin}" was updated (ID: ${record.id})`);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async remove(props: IProps, data: TRemoveRequest): Promise<void> {
    try {
      this.logger.log(`Deleting a "${this.origin}"`);
      const record = await this.repository.delete({
        where: {
          id: data.id,
          organization: {
            tenantId: props.tenantId,
          },
        },
      });

      this.eventService.remove(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
      await this.cacheService.del(EOriginRoutes.FUNNELS_PUBLIC, record.id);
      this.logger.log(`One "${this.origin}" was deleted (ID: ${record.id})`);
    } catch (err) {
      throw err;
    }
  }

  async saveFunnelDetails(funnelId: string, steps: any[], edges: any[]) {
    try {
      await this.prisma.$transaction(async (txn) => {
        // 1. Apaga todos os steps e edges não listados
        await txn.step.deleteMany({
          where: {
            funnelId,
          },
        });

        await txn.edge.deleteMany({
          where: {
            funnelId,
          },
        });

        // 2. Cria os steps e edges ausentes

        await txn.step.createMany({
          skipDuplicates: true,
          data: steps.map((step) => {
            return {
              id: step.id,
              funnelId,
              name: step.name,
              type: step.type,
              config: step.config,
              data: step.data,
            };
          }),
        });

        await txn.edge.createMany({
          skipDuplicates: true,
          data: edges.map((edge) => {
            return {
              id: edge.id,
              funnelId,
              originId: edge.originId,
              destinyId: edge.destinyId,
            };
          }),
        });
      });
    } catch (err) {
      throw err;
    }
  }
}
