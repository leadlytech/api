import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { BaseModuleService, ErrorService } from 'src/shared/services';
import { TSignUpRequest, TSignUpResponse } from '../dto';
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

  async getFunnelPublicData(txn: ITxn): Promise<TSignUpResponse> {
    try {
      const { content } = this.extract<any, any, TSignUpRequest>(txn);

      const record = await this.helperService.getFunnelPublicData(content);

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}
