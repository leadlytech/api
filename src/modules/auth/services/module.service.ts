import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

import { BaseModuleService, ErrorService } from 'src/shared/services';
import {
  TLoginRequest,
  TLoginResponse,
  TRecoveryRequest,
  TRecoveryResponse,
  TSignUpRequest,
  TSignUpResponse,
  TVerifyRequest,
  TVerifyResponse,
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

  async signUp(req: Request, res: Response): Promise<TSignUpResponse> {
    try {
      const { body, headers } = this.extract<any, any, TSignUpRequest>(
        req,
        res,
      );

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

  async login(req: Request, res: Response): Promise<TLoginResponse> {
    try {
      const { body, headers } = this.extract<any, any, TLoginRequest>(req, res);
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

  async recovery(req: Request, res: Response): Promise<TRecoveryResponse> {
    try {
      const { body, headers } = this.extract<any, any, TRecoveryRequest>(
        req,
        res,
      );
      await this.helperService.recovery({
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

  async verify(req: Request, res: Response): Promise<TVerifyResponse> {
    try {
      const { body } = this.extract<any, any, TVerifyRequest>(req, res);
      const record = await this.helperService.verify(body);

      return {
        statusCode: HttpStatus.CREATED,
        payload: record,
      };
    } catch (err) {
      this.errorService.process(err, this.origin);
    }
  }
}