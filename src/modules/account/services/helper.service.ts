import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { origin, TMembershipRequest } from '../dto';
import { IProps } from 'src/interfaces';

import { HelperService as UserHelperService } from 'src/modules/users/services';
import { HelperService as MemberHelperService } from 'src/modules/members/services';
import { EMemberStatus } from '@prisma/client';

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

  async me(props: IProps): Promise<Record<string, any>> {
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

      this.logger.log(`User data retrieved`);

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
