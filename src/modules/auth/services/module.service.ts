import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { BaseModuleService, ErrorService } from 'src/shared/services';
import {
  TSignUpRequest,
  TSignUpResponse,
  TLoginRequest,
  TLoginResponse,
  TVerifyRequest,
  TVerifyResponse,
  TConfirmRequest,
  TConfirmResponse,
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

  getOrigin(headers: Record<string, any | any[]>) {
    const origin = headers['origin'];
    if (!origin) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'ERR_MISSING_ORIGIN_HEADER',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return origin;
  }

  async signUp(txn: ITxn): Promise<TSignUpResponse> {
    try {
      const { body, headers } = this.extract<any, any, TSignUpRequest>(txn);

      const record = await this.helperService.signUp({
        ...body,
        origin: this.getOrigin(headers),
      });

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async login(txn: ITxn): Promise<TLoginResponse> {
    try {
      const { body, headers } = this.extract<any, any, TLoginRequest>(txn);
      const record = await this.helperService.login({
        ...body,
        origin: this.getOrigin(headers),
      });

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async verify(txn: ITxn): Promise<TVerifyResponse> {
    try {
      const { body, headers } = this.extract<any, any, TVerifyRequest>(txn);
      await this.helperService.verify({
        ...body,
        origin: this.getOrigin(headers),
      });

      return {
        statusCode: HttpStatus.OK,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }

  async confirm(txn: ITxn): Promise<TConfirmResponse> {
    try {
      const { body } = this.extract<any, any, TConfirmRequest>(txn);
      const record = await this.helperService.confirm(body);

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}
