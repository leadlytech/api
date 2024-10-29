import {
  INestApplication,
  Injectable,
  OnModuleInit,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Prisma');
  constructor() {
    let datasourceUrl = process.env.DATABASE_URL;

    if (!datasourceUrl || datasourceUrl.includes('user:pass@host:port')) {
      let dbSecretString: string | null = process.env.DB_SECRET;
      const database = process.env.DATABASE;

      if (dbSecretString) {
        dbSecretString = dbSecretString.replaceAll('\\', '');
        const dbSecret: { [key: string]: string | number } = JSON.parse(
          `${dbSecretString}`,
        );
        datasourceUrl = `${dbSecret.engine}://${dbSecret.username}:${dbSecret.password}@${dbSecret.host}:${dbSecret.port}/${database}`;
      }
    }

    super({
      log: [{ emit: 'event', level: 'query' }],
      datasourceUrl,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }

  DBErrorMessage(err: Prisma.PrismaClientKnownRequestError) {
    this.logger.error(`${err.code}) ${err}`);
    switch (err.code) {
      case 'P2025':
        throw new HttpException('ERR_DB_NOT_FOUND', HttpStatus.NOT_FOUND);
      case 'P2002':
      case 'P2003':
        throw new HttpException('ERR_DB_PK_CONFLICT', HttpStatus.BAD_REQUEST);
      default:
        throw new HttpException(
          'ERR_DB_UNKNOWN',
          HttpStatus.UNPROCESSABLE_ENTITY,
          {
            cause: err.code,
          },
        );
    }
  }
}
