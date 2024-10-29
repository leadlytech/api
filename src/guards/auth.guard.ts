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
  private origin = 'AuthGuard';
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

      let permissions: string[] = [];

      switch (props.auth.type) {
        case EAuthType.USER:
          const memberFound = await this.prisma.member.findFirst({
            where: {
              userId: props.auth.entityId,
              organizationId,
            },
            select: {
              owner: true,
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

          console.log(memberFound);

          if (!memberFound) {
            return false;
          }

          if (memberFound.owner) {
            return true;
          }

          for (const role of memberFound.MemberRole) {
            for (const permission of role.role.RolePermission) {
              permissions.push(permission.permission.value);
            }
          }
        case EAuthType.API:
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
            return keyPermission.permission.value;
          });
          break;
      }

      return false;
    } catch (err) {
      this.errorService.process(err, this.origin, false);
      return false;
    }
  }

  verifyRequiredParameters(params: string[]) {
    return params.every((params) => params);
  }
}
