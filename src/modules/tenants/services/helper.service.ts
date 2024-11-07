import { Injectable, Logger } from '@nestjs/common';
import { EOfferStatus } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  EventService,
  CacheService,
  SearchService,
  BaseHelperService,
} from 'src/shared/services';

import { EFieldType, EPaginationMode, TList } from 'src/interfaces';
import {
  IDefault,
  TCreateRequest,
  TFindRequest,
  TListRequest,
  TRemoveRequest,
  TUpdateRequest,
} from '../dto';
import { EOriginRoutes } from 'src/routes';
import { createRecordId } from 'src/utils';

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
  private origin = EOriginRoutes.TENANTS;
  private logger = new Logger(this.origin);
  private repository = this.prisma.tenant;

  async create(data: TCreateRequest): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Creating a new "${this.origin}"`);
      const record = await this.repository.create({
        data: {
          id: createRecordId(),
          name: data.name,
          domain: data.domain,
          smtp: data.smtp,
          smsDevKey: data.smsDevKey,
          pushInPayToken: data.pushInPayToken,
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
        select: {
          id: true,
          name: true,
          domain: true,
          createdAt: true,
        },
      });

      return listed;
    } catch (err) {
      throw err;
    }
  }

  async public(data: TFindRequest, renew = false): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Retrieving a single public "${this.origin}"`);

      type R = typeof this.repository;
      type RType = NonNullable<Awaited<ReturnType<R['findUniqueOrThrow']>>>;
      let record: Partial<RType> = null;

      if (!renew) {
        record = await this.cacheService.get(`${this.origin}:public`, data.id);
      }

      if (!record) {
        record = await this.repository.findFirstOrThrow({
          where: {
            domain: data.id,
          },
          select: {
            id: true,
            name: true,
            domain: true,
            Service: {
              select: {
                id: true,
                name: true,
                Offer: {
                  where: {
                    status: EOfferStatus.ACTIVE,
                  },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    amount: true,
                    recurrence: true,
                    Benefit: {
                      select: {
                        value: true,
                        resource: {
                          select: {
                            key: true,
                            name: true,
                            description: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!renew) {
          await this.cacheService.set(
            `${this.origin}:public`,
            record.id,
            record,
          );
        }
      }

      this.logger.log(
        `One public "${this.origin}" was retrieved (ID: ${record.id})`,
      );

      return record;
    } catch (err) {
      throw err;
    }
  }

  async findOne(data: TFindRequest, renew = false): Promise<Partial<IDefault>> {
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
          where: { id: data.id },
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

  async update(id: string, data: TUpdateRequest): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Updating a "${this.origin}"`);
      const record = await this.repository.update({
        where: { id },
        data: {
          name: data.name,
          domain: data.domain,
          smsDevKey: data.smsDevKey,
          pushInPayToken: data.pushInPayToken,
          ...(data.smtp
            ? {
                smtpHost: data.smtp.host,
                smtpPort: data.smtp.port,
                smtpUser: data.smtp.user,
                smtpPass: data.smtp.pass,
              }
            : undefined),
        },
      });

      this.eventService.update(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
      this.logger.log(`One "${this.origin}" was updated (ID: ${record.id})`);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async remove(data: TRemoveRequest): Promise<void> {
    try {
      this.logger.log(`Deleting a "${this.origin}"`);
      const record = await this.repository.delete({
        where: { id: data.id },
      });

      this.eventService.remove(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
      this.logger.log(`One "${this.origin}" was deleted (ID: ${record.id})`);
    } catch (err) {
      throw err;
    }
  }
}
