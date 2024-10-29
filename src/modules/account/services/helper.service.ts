import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { origin } from '../dto';
import { IProps } from 'src/interfaces';

import { HelperService as UserHelperService } from 'src/modules/users/services';

@Injectable()
export class HelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHelperService: UserHelperService,
  ) {}
  private origin = origin;
  private logger = new Logger(this.origin);
  private repository = this.prisma.user;

  async me(props: IProps): Promise<Record<string, any>> {
    try {
      this.logger.log(`Getting me`);
      const user = await this.userHelperService.findOne(props, {
        id: props.auth.entityId,
      });
      const members = await this.prisma.member.findMany({
        where: {
          userId: props.auth.entityId,
        },
        select: {
          id: true,
          organizationId: true,
          status: true,
          owner: true,
          createdAt: true,
        },
      });

      user['members'] = members;

      return user;
    } catch (err) {
      throw err;
    }
  }
}
