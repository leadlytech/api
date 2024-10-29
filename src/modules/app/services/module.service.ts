import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IResponse } from 'src/interfaces';

@Injectable()
export class ModuleService {
  private origin = ModuleService.name;
  private logger = new Logger(this.origin);

  healthCheck(): IResponse {
    this.logger.debug('Health Check Verification');
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }
}
