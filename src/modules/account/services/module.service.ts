import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

import { BaseModuleService, ErrorService } from 'src/shared/services';
import { HelperService } from './helper.service';

@Injectable()
export class ModuleService extends BaseModuleService {
  constructor(
    private readonly errorService: ErrorService,
    private readonly helperService: HelperService,
  ) {
    super();
  }
  private origin = ModuleService.name;
  private logger = new Logger(this.origin);

  async me(req: Request, res: Response): Promise<any> {
    try {
      const { props } = this.extract<any, any, any>(req, res);
      const record = await this.helperService.me(props);

      delete record['tenantId'];
      delete record['password'];
      delete record['emailUpdate'];
      delete record['phoneNumberUpdate'];

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}
