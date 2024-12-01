import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

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
  private repository = this.prisma.key;

  async create(
    props: IProps,
    data: TCreateRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Creating a new "${this.origin}"`);
      const record = await this.repository.create({
        data: {
          id: createRecordId(),
          value: randomUUID(),
          organization: {
            connect: {
              id: data.organizationId,
              tenantId: props.tenantId,
            },
          },
        },
        select: {
          id: true,
          value: true,
        },
      });

      await this.connectPermissions(
        props.tenantId,
        record.id,
        data.permissions,
      );

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

      const listed = await this.listing<R, F, W, S, O>(
        this.repository,
        data,
        {
          logger: this.logger,
          origin: this.origin,
          restrictPaginationToMode,
          searchableFields: {
            id: EFieldType.STRING,
          },
          sortFields: ['id'],
          mergeWhere: {
            organizationId: data.organizationId,
            organization: {
              id: data.organizationId,
              tenantId: props.tenantId,
            },
          },
          select: {
            id: true,
            value: true,
            disabled: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        (elements) => {
          for (const element of elements) {
            element['value'] =
              `${element['value'].slice(0, 5)}${'*'.repeat(element['value'].length - 5)}`;
            element['disabled'] = element['disabled'] ?? false;
          }
          return elements;
        },
      );

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
              id: data.organizationId,
              tenantId: props.tenantId,
            },
          },
          select: {
            id: true,
            disabled: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!renew) {
          await this.cacheService.set(this.origin, record.id, record);
        }
      }

      record['disabled'] = record['disabled'] ?? false;

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
            id: data.organizationId,
            tenantId: props.tenantId,
          },
        },
        data,
      });

      if (data.permissions) {
        await this.connectPermissions(
          props.tenantId,
          record.id,
          data.permissions,
        );
      }

      this.eventService.update(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
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
            id: data.organizationId,
            tenantId: props.tenantId,
          },
        },
      });

      this.eventService.remove(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
      this.logger.log(`One "${this.origin}" was deleted (ID: ${record.id})`);
    } catch (err) {
      throw err;
    }
  }

  async connectPermissions(
    tenantId: string,
    keyId: string,
    permissionsValues: string[],
  ) {
    try {
      // Pega os ID's das permissões a serem conectadas
      const permissions = await this.prisma.permission.findMany({
        where: {
          tenantId,
          value: { in: permissionsValues },
          restrict: { not: true },
        },
        select: {
          id: true,
        },
      });

      const permissionsIds = permissions.map((permission) => permission.id);

      // Apaga as permissões conectadas que não estejam na lista anterior
      await this.prisma.keyPermission.deleteMany({
        where: {
          keyId,
          permissionId: { notIn: permissionsIds },
        },
      });

      // Cria as conexões ausentes
      await this.prisma.keyPermission.createMany({
        skipDuplicates: true,
        data: permissionsIds.map((permissionId) => {
          return {
            keyId,
            permissionId,
          };
        }),
      });
    } catch (err) {
      throw err;
    }
  }
}
