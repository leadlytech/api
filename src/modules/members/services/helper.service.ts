import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

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
  private repository = this.prisma.member;

  async create(
    props: IProps,
    data: TCreateRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Creating a new "${this.origin}"`);
      const verifyUser = await this.prisma.user.findFirst({
        where: {
          tenantId: props.tenantId,
          email: data.email,
        },
        select: {
          id: true,
        },
      });

      if (verifyUser) {
        // Verifica se o usuário já faz parte da organização
        const verifyMember = await this.repository.findFirst({
          where: {
            userId: verifyUser?.id,
          },
        });

        if (verifyMember) {
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'ERR_USER_IS_ALREADY_A_MEMBER',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const record = await this.repository.create({
        data: {
          id: createRecordId(),
          inviteEmail: verifyUser?.id ? undefined : data.email,
          owner: data.owner,
          status: data.status,
          ...(verifyUser?.id
            ? {
                user: {
                  connect: {
                    id: verifyUser?.id,
                  },
                },
              }
            : undefined),
          organization: {
            connect: {
              id: data.organizationId,
              tenantId: props.tenantId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (verifyUser) {
        await this.cacheService.del(this.origin, `relations:${verifyUser.id}`);
      }

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
            userId: EFieldType.STRING,
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
            status: true,
            owner: true,
            inviteEmail: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        (elements) => {
          for (const element of elements) {
            element['owner'] = element['owner'] ?? false;
          }
          return elements;
        },
      );

      return listed;
    } catch (err) {
      throw err;
    }
  }

  async findUserMemberships(props: IProps, userId: string) {
    try {
      let record = await this.cacheService.get(
        this.origin,
        `relations:${userId}`,
      );

      if (!record) {
        const members = await this.prisma.member.findMany({
          where: {
            userId,
          },
          select: {
            id: true,
            organizationId: true,
          },
        });

        record = await Promise.all(
          members.map((member) => this.findOne(props, member, true)),
        ).then((values) => {
          return values.map((value) => {
            delete value['user'];
            return value;
          });
        });

        await this.cacheService.set(this.origin, `relations:${userId}`, record);
      }

      return record;
    } catch (err) {
      throw err;
    }
  }

  async findOne(props: IProps, data: TFindRequest, renew = false) {
    try {
      this.logger.log(`Retrieving a single "${this.origin}"`);

      type R = typeof this.repository;
      type RType = NonNullable<Awaited<ReturnType<R['findUniqueOrThrow']>>>;
      let record: Partial<RType> = null;

      if (!renew) {
        record = await this.cacheService.get(this.origin, data.id);
      }

      if (!record) {
        record = await this.prisma.$transaction(async (txn) => {
          record = await txn.member.findUniqueOrThrow({
            where: {
              id: data.id,
              organization: {
                id: data.organizationId,
                tenantId: props.tenantId,
              },
            },
            select: {
              id: true,
              userId: true,
              status: true,
              owner: true,
              createdAt: true,
              updatedAt: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
              user: {
                select: {
                  id: true,
                  status: true,
                  lockReason: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  emailVerifiedAt: true,
                },
              },
            },
          });

          const memberRoles = await txn.memberRole.findMany({
            where: {
              memberId: record.id,
            },
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  RolePermission: {
                    select: {
                      permission: {
                        select: {
                          value: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          record['roles'] = memberRoles.map((memberRole) => {
            record['permissions'] = memberRole.role.RolePermission.map(
              (rolePermission) => rolePermission.permission.value,
            );

            delete memberRole['role']['RolePermission'];
            return memberRole.role;
          });

          record['owner'] = record['owner'] ?? false;
          delete record['MemberRole'];

          return record;
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
            id: data.organizationId,
            tenantId: props.tenantId,
          },
        },
        data,
      });

      this.eventService.update(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
      await this.cacheService.del(this.origin, `relations:${record.userId}`);
      this.logger.log(`One "${this.origin}" was updated (ID: ${record.id})`);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async remove(props: IProps, data: TRemoveRequest): Promise<void> {
    try {
      this.logger.log(`Deleting a "${this.origin}"`);
      const verify = await this.repository.findUniqueOrThrow({
        where: {
          id: data.id,
        },
        select: {
          owner: true,
        },
      });

      if (verify.owner) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'ERR_CANNOT_REMOVE_ORGANIZATION_OWNER',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

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
      await this.cacheService.del(this.origin, `relations:${record.userId}`);
      this.logger.log(`One "${this.origin}" was deleted (ID: ${record.id})`);
    } catch (err) {
      throw err;
    }
  }
}
