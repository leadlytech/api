import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { IDefault, origin, TMembershipRequest, TUpdateMeRequest } from '../dto';
import { IProps } from 'src/interfaces';

import { HelperService as UserHelperService } from 'src/modules/users/services';
import { HelperService as MemberHelperService } from 'src/modules/members/services';
import { EMemberStatus } from '@prisma/client';
import { verifyPassword } from 'src/utils';

@Injectable()
export class HelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHelperService: UserHelperService,
    private readonly memberService: MemberHelperService,
  ) {}
  private origin = origin;
  private logger = new Logger(this.origin);
  private repository = this.prisma.user;

  async findMe(props: IProps): Promise<Record<string, any>> {
    try {
      this.logger.log(`Getting me...`);
      const user = await this.userHelperService.findOne(props, {
        id: props.auth.entityId,
      });

      const members = await this.memberService.findUserMemberships(
        props,
        user.id,
      );

      user['members'] = members;

      this.logger.log(`User account data retrieved`);

      return user;
    } catch (err) {
      throw err;
    }
  }

  async updateMe(
    props: IProps,
    data: TUpdateMeRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Getting me...`);

      if (
        (data.password && !data.newPassword) ||
        (!data.password && data.newPassword)
      ) {
        throw new HttpException(
          'Para alterar a senha, a senha atual (password) e a nova (newPassword) devem ser fornecidas',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Processo de verificação para alteração de senha
      if (data.password) {
        const verification = await this.repository.findUnique({
          where: {
            id: props.auth.entityId,
            tenantId: props.tenantId,
          },
          select: {
            password: true,
          },
        });

        const verifyPass = await verifyPassword(
          data.password,
          verification.password,
        );

        if (!verifyPass) {
          throw new HttpException(
            {
              message: 'ERR_INVALID_PASSWORD',
            },
            HttpStatus.UNAUTHORIZED,
          );
        }

        data['password'] = data.newPassword;
        delete data['newPassword'];
      }

      const user = await this.userHelperService.update(
        props,
        props.auth.entityId,
        data,
      );

      return user;
    } catch (err) {
      throw err;
    }
  }

  async member(
    props: IProps,
    data: TMembershipRequest,
  ): Promise<Record<string, any>> {
    try {
      this.logger.log(`Changing membership status...`);
      const member = await this.prisma.member.findFirstOrThrow({
        where: {
          userId: props.auth.entityId,
          organizationId: data.organizationId,
        },
      });

      // Se o usuário quer sair da organização então o registro na tabela "member" é simplesmente apagado
      if (data.action === 'LEAVE') {
        await this.memberService.remove(props, {
          id: member.id,
          organizationId: member.organizationId,
        });
        return;
      }

      // Se o usuário estiver tentado aceitar o convite mas já for membro é retornado um erro
      if (data.action === 'ACCEPT' && member.status === EMemberStatus.ACTIVE) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'ERR_USER_IS_ALREADY_A_MEMBER',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Se o usuário estiver tentando aceitar o convite, mas seu status na organização for "disabled" é retornado um erro
      if (
        data.action === 'ACCEPT' &&
        member.status === EMemberStatus.DISABLED
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'ERR_USER_IS_DISABLED',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.memberService.update(props, member.id, {
        organizationId: member.organizationId,
        status: EMemberStatus.ACTIVE,
      });

      this.logger.log(`Membership status changed`);
    } catch (err) {
      throw err;
    }
  }
}
