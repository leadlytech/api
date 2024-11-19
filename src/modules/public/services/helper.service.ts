import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/shared/services';

import { origin, TSignUpRequest } from '../dto';

// import { HelperService as FunnelHelperService } from 'src/modules/funnels/services';

@Injectable()
export class HelperService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly funnelHelperService: FunnelHelperService,
    private readonly cacheService: CacheService,
  ) {}
  private origin = origin;
  private logger = new Logger(this.origin);
  private repository = this.prisma.funnel;

  async getFunnelPublicData(data: TSignUpRequest) {
    try {
      this.logger.log(`Retrieving a single "${this.origin}"`);

      // TODO: Fazer a busca pelo módulo de funnels e criar campo de estado de publicação
      // para retornar os dados apenas se o funil existir e estiver publicado

      type R = typeof this.repository;
      type RType = NonNullable<Awaited<ReturnType<R['findUniqueOrThrow']>>>;
      let record: Partial<RType> = await this.cacheService.get(
        this.origin,
        data.id,
      );

      if (!record) {
        record = await this.repository.findUniqueOrThrow({
          where: {
            id: data.id,
          },
          select: {
            id: true,
            Step: {
              select: {
                id: true,
                name: true,
                type: true,
                config: true,
                data: true,
              },
            },
            Edge: {
              select: {
                id: true,
                originId: true,
                destinyId: true,
              },
            },
          },
        });

        await this.cacheService.set(this.origin, record.id, record);
      }

      this.logger.log(`One "${this.origin}" was retrieved (ID: ${record.id})`);

      return record;
    } catch (err) {
      throw err;
    }
  }
}
