import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { BaseModuleService, ErrorService } from 'src/shared/services';
import {
  TCreateRequest,
  TCreateResponse,
  TFindRequest,
  TFindResponse,
  TListRequest,
  TListResponse,
  TRemoveRequest,
  TRemoveResponse,
  TUpdateRequest,
  TUpdateResponse,
} from '../dto';
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

  async create(txn: ITxn): Promise<TCreateResponse> {
    try {
      const { body } = this.extract<any, any, TCreateRequest>(txn);
      const payload = await this.helperService.create(body);

      return {
        statusCode: HttpStatus.CREATED,
        payload,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async list(txn: ITxn): Promise<TListResponse> {
    try {
      const { query } = this.extract<any, TListRequest, any>(txn);
      const payload = await this.helperService.list(query);

      return {
        statusCode: HttpStatus.OK,
        payload,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async public(txn: ITxn): Promise<TFindResponse> {
    try {
      const { headers } = this.extract<any, TListRequest, any>(txn);

      const origin: string = headers['origin'];

      if (!origin) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      const payload = await this.helperService.public({
        id: origin,
      });

      return {
        statusCode: HttpStatus.OK,
        payload,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async findOne(txn: ITxn): Promise<TFindResponse> {
    try {
      const { params } = this.extract<TFindRequest, any, any>(txn);
      const record = await this.helperService.findOne(params);

      return {
        statusCode: HttpStatus.OK,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async update(txn: ITxn): Promise<TUpdateResponse> {
    try {
      const { params, body } = this.extract<
        Record<'id', string>,
        any,
        TUpdateRequest
      >(txn);
      await this.helperService.update(params.id, body);

      return {
        statusCode: HttpStatus.OK,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async remove(txn: ITxn): Promise<TRemoveResponse> {
    try {
      const { params } = this.extract<TRemoveRequest, any, any>(txn);
      await this.helperService.remove(params);

      return {
        statusCode: HttpStatus.NO_CONTENT,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}
