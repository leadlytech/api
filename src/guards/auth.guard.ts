import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';

// Interfaces
import { IProps, IAuthConfig, JwtDto, EAuthType } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
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
  private origin = 'authGuard';
  private logger = new Logger(this.origin);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: Request = context.switchToHttp().getRequest();
      const authConfig: IAuthConfig =
        this.reflector.get('authConfig', context.getHandler()) ||
        this.reflector.get('authConfig', context.getClass());
      const permissionConfig: string | undefined =
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

        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            tenantId: true,
          },
        });

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
      const verifyPermission = await this.prisma.permission.findFirst({
        where: {
          value: permissionConfig,
          tenantId: props.tenantId,
        },
      });

      if (!verifyPermission) {
        await this.prisma.permission.create({
          data: {
            id: createRecordId(),
            tenantId: props.tenantId,
            name: permissionConfig,
            value: permissionConfig,
            restrict: true,
          },
        });
      }

      // Obtém todas as permissões relativas à entidade autenticada
      const permissions = await this.getPermissions(props);

      for (const permission of permissions) {
        if (
          permission['p'] === permissionConfig &&
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
        `${props.auth.type}:${props.auth.entityId}`,
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
        `${props.auth.type}:${props.auth.entityId}`,
        permissions,
        {
          ttl: 86400, // 1d
        },
      );
      return permissions;
    } catch (err) {
      return [];
    }
  }
}
