import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { BaseModuleService, ErrorService } from 'src/shared/services';
import { TStatisticsRequest, TStatisticsResponse } from '../dto';
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

  async statistics(txn: ITxn): Promise<TStatisticsResponse> {
    try {
      const { props, content } = this.extract<
        Record<'organizationId', string>,
        TStatisticsRequest,
        any
      >(txn);
      const payload = await this.helperService.statistics(props, content);

      return {
        statusCode: HttpStatus.OK,
        payload,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}
