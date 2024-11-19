import { Controller, Get, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

import { ModuleService } from '../services';
import { getPublicFunnelDataSchema } from '../dto';
import { IResponse } from 'src/interfaces';
import { BaseModuleController } from 'src/shared/services';

@Controller()
export class ModuleController extends BaseModuleController {
  constructor(private readonly moduleService: ModuleService) {
    super();
  }

  @Get('funnels/:id')
  async getFunnelPublicData(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<IResponse> {
    const response: IResponse = await this.moduleService.getFunnelPublicData(
      this.validate(req, res, getPublicFunnelDataSchema),
    );
    return res.status(response.statusCode).json(response);
  }
}
