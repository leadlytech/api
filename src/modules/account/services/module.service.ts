import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { BaseModuleService, ErrorService } from 'src/shared/services';
import { HelperService } from './helper.service';
import { ITxn } from 'src/interfaces';

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

  async me(txn: ITxn): Promise<any> {
    try {
      const { props } = this.extract<any, any, any>(txn);
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
