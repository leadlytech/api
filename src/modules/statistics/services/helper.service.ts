import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SearchService, BaseHelperService } from 'src/shared/services';

import { IProps } from 'src/interfaces';
import { origin, TStatisticsRequest } from '../dto';

@Injectable()
export class HelperService extends BaseHelperService {
  constructor(
    private readonly prisma: PrismaService,
    searchService: SearchService,
  ) {
    super(searchService);
  }
  private origin = origin;
  private logger = new Logger(this.origin);

  async statistics(props: IProps, data: TStatisticsRequest): Promise<any> {
    this.logger.log(`Listing "${this.origin}"`);
    try {
      const funnels = await this.prisma.funnel.aggregate({
        where: {
          organizationId: data.organizationId,
        },
        _count: {
          _all: true,
        },
      });

      const leads = await this.prisma.lead.aggregate({
        where: {
          organizationId: data.organizationId,
        },
        _count: {
          _all: true,
        },
      });

      return { funnels, leads };
    } catch (err) {
      throw err;
    }
  }
}
