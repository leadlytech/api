import { Controller, Post, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

import { ModuleService } from '../services';
import {
  loginSchema,
  signUpSchema,
  origin,
  recoverySchema,
  verifySchema,
} from '../dto';
import { IResponse } from 'src/interfaces';
import { Validate } from 'src/decorators';

@Controller({ path: origin })
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post('signup')
  @Validate(signUpSchema)
  async signUp(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.signUp(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Post('login')
  @Validate(loginSchema)
  async login(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.login(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Post('recovery')
  @Validate(recoverySchema)
  async recovery(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<IResponse> {
    const response: IResponse = await this.moduleService.recovery(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Post('verify')
  @Validate(verifySchema)
  async verify(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.verify(req, res);
    return res.status(response.statusCode).json(response);
  }
}
