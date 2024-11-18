import { Controller, Get, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

import { ModuleService } from '../services';
import { statisticsSchema, origin } from '../dto';
import { EAction, IResponse } from 'src/interfaces';
import { Auth, Permission } from 'src/decorators';
import { BaseModuleController } from 'src/shared/services';

@Auth()
@Controller({ path: `organizations/:organizationId/${origin}` })
export class ModuleController extends BaseModuleController {
  constructor(private readonly moduleService: ModuleService) {
    super();
  }

  @Get()
  @Permission(`${origin}:${EAction.READ}`, false)
  async list(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.statistics(
      this.validate(req, res, statisticsSchema),
    );
    return res.status(response.statusCode).json(response);
  }
}
