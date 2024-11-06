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
      const { props, params } = this.extract<
        Record<'organizationId', string>,
        any,
        TCreateRequest
      >(txn);
      const record = await this.helperService.create(props, params);

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async list(txn: ITxn): Promise<TListResponse> {
    try {
      const { props, params, query } = this.extract<
        Record<'organizationId', string>,
        TListRequest,
        any
      >(txn);
      const payload = await this.helperService.list(props, {
        ...params,
        ...query,
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
      const { props, params } = this.extract<TFindRequest, any, any>(txn);
      const record = await this.helperService.findOne(props, params);

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
      const { props, params, body } = this.extract<
        Record<'id', string>,
        any,
        TUpdateRequest
      >(txn);
      await this.helperService.update(props, params.id, body);

      return {
        statusCode: HttpStatus.OK,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async remove(txn: ITxn): Promise<TRemoveResponse> {
    try {
      const { props, params } = this.extract<TRemoveRequest, any, any>(txn);
      await this.helperService.remove(props, params);

      return {
        statusCode: HttpStatus.NO_CONTENT,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}
