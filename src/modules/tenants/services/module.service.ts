import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

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

  async create(req: Request, res: Response): Promise<TCreateResponse> {
    try {
      const { body } = this.extract<any, any, TCreateRequest>(req, res);
      const record = await this.helperService.create(body);

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async list(req: Request, res: Response): Promise<TListResponse> {
    try {
      const { query } = this.extract<any, TListRequest, any>(req, res);
      const payload = await this.helperService.list(query);

      return {
        statusCode: HttpStatus.OK,
        payload,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async findOne(req: Request, res: Response): Promise<TFindResponse> {
    try {
      const { params } = this.extract<TFindRequest, any, any>(req, res);
      const record = await this.helperService.findOne(params);

      return {
        statusCode: HttpStatus.OK,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async update(req: Request, res: Response): Promise<TUpdateResponse> {
    try {
      const { params, body } = this.extract<
        Record<'id', string>,
        any,
        TUpdateRequest
      >(req, res);
      await this.helperService.update(params.id, body);

      return {
        statusCode: HttpStatus.OK,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async remove(req: Request, res: Response): Promise<TRemoveResponse> {
    try {
      const { params } = this.extract<TRemoveRequest, any, any>(req, res);
      await this.helperService.remove(params);

      return {
        statusCode: HttpStatus.NO_CONTENT,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}
