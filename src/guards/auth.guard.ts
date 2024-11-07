import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Permission, User } from '@prisma/client';

import { Request } from 'express';

import {
  IProps,
  IAuthConfig,
  JwtDto,
  EAuthType,
  IPermissionConfig,
} from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { EOriginRoutes } from 'src/routes';
import { CacheService, ErrorService } from 'src/shared/services';
import { createRecordId, TEnv } from 'src/utils';

interface IPermission {
  p: string;
  o?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<TEnv>,
    private readonly errorService: ErrorService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}
  private origin = EOriginRoutes.AUTH_GUARD;
  private logger = new Logger(this.origin);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: Request = context.switchToHttp().getRequest();
      const authConfig: IAuthConfig =
        this.reflector.get('authConfig', context.getHandler()) ||
        this.reflector.get('authConfig', context.getClass());
      const permissionConfig: IPermissionConfig | undefined =
        this.reflector.get('permissionConfig', context.getHandler()) ||
        this.reflector.get('permissionConfig', context.getClass());
      const authorization = request.headers['authorization'] as string;

      if (authConfig?.skip) {
        return true;
      }

      if (!authorization) {
        return false;
      }

      // Verificação por chave de sistema
      if (authConfig?.onlySystemKey) {
        if (authorization !== this.configService.get<string>('SYSTEM_KEY')) {
          return false;
        }

        const props: IProps = {
          tenantId: undefined,
          auth: {
            type: EAuthType.SYSTEM,
          },
        };
        request['props'] = props;
        return true;
      }

      let props: IProps;
      const organizationId = request.params.organizationId || undefined;

      if (authorization.toLocaleLowerCase().includes('bearer')) {
        const decoded: JwtDto = this.jwtService.verify(
          authorization.split(' ')[1],
          {
            secret: this.configService.get<string>('SYSTEM_KEY'),
          },
        );

        if (!decoded) {
          return false;
        }

        // Busca o respectivo usuário nos dados do cache
        let user = await this.cacheService.get<Partial<User>>(
          this.origin,
          `user:${decoded.userId}`,
        );

        /**
         * Se o usuário não for encontrado ele é buscado no banco de dados
         * e então os dados são cacheados (Mesmo se forem nulos)
         */
        if (!user) {
          user = await this.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              tenantId: true,
            },
          });

          await this.cacheService.set(
            this.origin,
            `user:${decoded.userId}`,
            user,
          );
        }

        if (user) {
          props = {
            tenantId: user.tenantId,
            auth: {
              entityId: decoded.userId,
              type: EAuthType.USER,
            },
          };
        }
      } else if (!authConfig?.blockAPIKey) {
        const apiKey = await this.prisma.key.findFirst({
          where: {
            value: authorization,
            organizationId,
          },
          select: {
            id: true,
            organization: {
              select: {
                id: true,
                tenantId: true,
              },
            },
          },
        });

        if (apiKey) {
          props = {
            tenantId: apiKey.organization.tenantId,
            auth: {
              entityId: apiKey.id,
              type: EAuthType.API,
            },
          };
        }
      }

      // Se não foi possível autenticar nem por token de
      // usuário e nem por chave de API o acesso é negado
      if (!props) {
        return false;
      }

      request['props'] = props;

      // Se não é necessário nenhuma permissão específica o acesso é liberado
      if (!permissionConfig) {
        return true;
      }

      // Se uma permissão é necessária, então primeiro é verificado se ela está registrada

      // Primeiro é verificado se a permissão existe no cache
      let verifyPermission = await this.cacheService.get<Permission>(
        this.origin,
        `cachedPermission:${permissionConfig.key}`,
      );

      /**
       * Se a permissão não estiver em cache, ela é buscada no banco
       * e se localizada é então cacheada
       */
      if (!verifyPermission) {
        verifyPermission = await this.prisma.permission.findFirst({
          where: {
            value: permissionConfig.key,
            tenantId: props.tenantId,
          },
        });
      }

      /**
       * Se a permissão do sistema não está nem no cache
       * e nem no banco ela não existe e então é criada
       */
      if (!verifyPermission) {
        /**
         * Pra uma nova role ser adicionada no sistema, isso deve ser feito de modo
         * a conceder a permissão criada às organizações caso ela seja desse tipo.
         * Isso é definido pelo parâmetro "restrict", se verdadeiro apenas os proprietários
         * do sistema podem mudar, se falso então pode ser gerido pelas organizações
         */
        await this.prisma.$transaction(async (txn) => {
          const restrict = permissionConfig.restrict ?? true;

          const newPermission = await txn.permission.create({
            data: {
              id: createRecordId(),
              tenantId: props.tenantId,
              name: permissionConfig.key,
              value: permissionConfig.key,
              restrict,
            },
          });

          if (!restrict) {
            const rolesToConnect = await txn.role.findMany({
              where: {
                selfManaged: true,
                organization: {
                  tenantId: props.tenantId,
                },
              },
              select: {
                id: true,
              },
            });

            await txn.rolePermission.createMany({
              data: rolesToConnect.map((role) => {
                return {
                  roleId: role.id,
                  permissionId: newPermission.id,
                };
              }),
            });

            // Apaga os dados de permissões em cache para que possam renovados devido à adição

            // Deleção dos dados em cache de "membros"
            await this.cacheService.delByPattern(
              EOriginRoutes.MEMBERS,
              `relations:*`,
            );

            // Deleção dos dados em cache de "permissões" do guard
            await this.cacheService.delByPattern(
              this.origin,
              `entityPermissions:${props.auth.type}:*`,
            );
          }
        });
      }

      // Obtém todas as permissões relativas à entidade autenticada
      const permissions = await this.getPermissions(props);

      for (const permission of permissions) {
        if (
          permission['p'] === permissionConfig.key &&
          [undefined, organizationId].includes(permission['o'])
        ) {
          return true;
        }
      }

      return false;
    } catch (err) {
      this.errorService.process(err, this.origin, false);
      return false;
    }
  }

  private async getPermissions(props: IProps): Promise<IPermission[]> {
    try {
      let permissions: Array<IPermission> = await this.cacheService.get(
        this.origin,
        `entityPermissions:${props.auth.type}:${props.auth.entityId}`,
      );

      if (permissions) return permissions;
      permissions = [];

      switch (props.auth.type) {
        case EAuthType.USER:
          const members = await this.prisma.member.findMany({
            where: {
              userId: props.auth.entityId,
            },
            select: {
              owner: true,
              organizationId: true,
              MemberRole: {
                select: {
                  role: {
                    select: {
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
              },
            },
          });

          for (const member of members) {
            for (const role of member.MemberRole) {
              for (const permission of role.role.RolePermission) {
                permissions.push({
                  p: permission.permission.value,
                  o: member.organizationId,
                });
              }
            }
          }

          const userPermissions = await this.prisma.userPermission.findMany({
            where: {
              userId: props.auth.entityId,
            },
            select: {
              permission: {
                select: {
                  value: true,
                },
              },
            },
          });

          for (const userPermission of userPermissions) {
            permissions.push({
              p: userPermission.permission.value,
            });
          }
          break;
        case EAuthType.API:
          const key = await this.prisma.key.findFirstOrThrow({
            where: {
              id: props.auth.entityId,
            },
            select: {
              organization: {
                select: {
                  id: true,
                },
              },
            },
          });

          const keyPermissions = await this.prisma.keyPermission.findMany({
            where: {
              keyId: props.auth.entityId,
            },
            select: {
              permission: {
                select: {
                  value: true,
                },
              },
            },
          });

          permissions = keyPermissions.map((keyPermission) => {
            return {
              p: keyPermission.permission.value,
              o: key.organization.id,
            };
          });
          break;
      }

      await this.cacheService.set(
        this.origin,
        `entityPermissions:${props.auth.type}:${props.auth.entityId}`,
        permissions,
        {
          ttl: 86400, // 1d
        },
      );
      return permissions;
    } catch (err) {
      this.logger.error(err);
      return [];
    }
  }
}
