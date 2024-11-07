import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  EventService,
  CacheService,
  SearchService,
  BaseHelperService,
} from 'src/shared/services';

import {
  EAuthType,
  EFieldType,
  EPaginationMode,
  IProps,
  TList,
} from 'src/interfaces';
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
import { EMemberStatus } from '@prisma/client';
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
  private repository = this.prisma.organization;

  async create(
    props: IProps,
    data: TCreateRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Creating a new "${this.origin}"`);

      const record = await this.prisma.$transaction(async (txn) => {
        const newOrganizationId = createRecordId();
        const newMemberId = createRecordId();

        // Cria a organização e conecta o usuário como seu proprietário
        const record = await txn.organization.create({
          data: {
            id: newOrganizationId,
            tenantId: props.tenantId,
            name: data.name,
            Member: {
              create: {
                id: newMemberId,
                userId: data.userId,
                status: EMemberStatus.ACTIVE,
                owner: true,
              },
            },
          },
          select: {
            id: true,
          },
        });

        // Obtém as permissões gerenciáveis por organizações
        const permissions = await txn.permission.findMany({
          where: {
            tenantId: props.tenantId,
            OR: [
              {
                restrict: false,
              },
              {
                restrict: null,
              },
            ],
          },
          select: {
            id: true,
            name: true,
          },
        });

        // Cria a role padrão e conecta com a organização criada e ao usuário proprietário
        await txn.role.create({
          data: {
            id: createRecordId(),
            description: '',
            name: 'ADMIN',
            selfManaged: true,
            organization: {
              connect: {
                id: newOrganizationId,
              },
            },
            MemberRole: {
              create: {
                memberId: newMemberId,
              },
            },
            RolePermission: {
              createMany: {
                skipDuplicates: true,
                data: permissions.map((permission) => {
                  return {
                    permissionId: permission.id,
                  };
                }),
              },
            },
          },
        });

        return record;
      });

      await this.clearCacheForUsers([data.userId]);

      this.logger.log(`New "${this.origin}" created (ID: ${record.id})`);
      this.eventService.create(this.origin, record);

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
          tenantId: props.tenantId,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
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
        record = await this.cacheService.get(this.origin, data.organizationId);
      }

      if (!record) {
        record = await this.repository.findUniqueOrThrow({
          where: {
            id: data.organizationId,
            tenantId: props.tenantId,
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
          tenantId: props.tenantId,
        },
        data,
      });

      this.logger.log(`One "${this.origin}" was updated (ID: ${record.id})`);
      this.eventService.update(this.origin, record);
      await this.cacheService.del(this.origin, record.id);

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
          id: data.organizationId,
          tenantId: props.tenantId,
        },
        select: {
          id: true,
          Member: {
            select: {
              userId: true,
            },
          },
        },
      });

      await this.clearCacheForUsers(
        record.Member.map((member) => member.userId),
      );

      this.logger.log(`One "${this.origin}" was deleted (ID: ${record.id})`);
      this.eventService.remove(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
    } catch (err) {
      throw err;
    }
  }

  async clearCacheForUsers(userIds: string[]): Promise<void> {
    try {
      userIds.map(async (userId) => {
        /**
         * Apaga as permissões salvas em cache do usuário para o qual a organização foi criada,
         * assim fazendo com que elas sejam renovadas na próxima solicitação
         */
        await this.cacheService.del(
          EOriginRoutes.AUTH_GUARD,
          `entityPermissions:${EAuthType.USER}:${userId}`,
        );

        // Apaga as relações de membro do cache para renovação futura
        await this.cacheService.del(
          EOriginRoutes.MEMBERS,
          `relations:${userId}`,
        );
      });
    } catch (err) {
      throw err;
    }
  }
}
