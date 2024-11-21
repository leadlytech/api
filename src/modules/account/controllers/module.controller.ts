import { Controller, Res, Req, Get, Post, Patch } from '@nestjs/common';
import { Request, Response } from 'express';

import { ModuleService } from '../services';
import { updateMeSchema, membershipSchema, origin } from '../dto';
import { IResponse } from 'src/interfaces';
import { Auth } from 'src/decorators';
import { BaseModuleController } from 'src/shared/services';

@Auth({
  blockAPIKey: true,
})
@Controller({ path: origin })
export class ModuleController extends BaseModuleController {
  constructor(private readonly moduleService: ModuleService) {
    super();
  }

  @Get()
  async findMe(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.findMe({ req, res });
    return res.status(response.statusCode).json(response);
  }

  @Patch()
  async updateMe(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<IResponse> {
    const response: IResponse = await this.moduleService.updateMe(
      this.validate(req, res, updateMeSchema),
    );
    return res.status(response.statusCode).json(response);
  }

  @Post('membership')
  async member(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.member(
      this.validate(req, res, membershipSchema),
    );
    return res.status(response.statusCode).json(response);
  }
}
