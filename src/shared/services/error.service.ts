import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';

// PRISMA
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ErrorService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(ErrorService.name);

  process(err: any, origin: any, throwError = true) {
    this.logger.error(`ERROR ORIGIN: ${origin}`);
    this.logger.error(err);
    if (!throwError) {
      return;
    }
    if (err instanceof HttpException) {
      throw new HttpException(err.getResponse(), err.getStatus());
    } else if (err instanceof HttpException) {
      this.logger.error(`ERROR INSTANCE TYPE: HttpException`);
      throw new HttpException(err.getResponse(), err.getStatus());
    } else if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      throwError
    ) {
      this.logger.error(`ERROR INSTANCE TYPE: DBException`);
      this.prisma.DBErrorMessage(err);
    }
    throw new HttpException(
      process.env.NODE_ENV === 'production' ? 'ERR_INTERNAL' : err.message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
