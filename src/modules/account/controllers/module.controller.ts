import { Controller, Res, Req, Get } from '@nestjs/common';
import { Request, Response } from 'express';

import { ModuleService } from '../services';
import { origin } from '../dto';
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
  async me(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.me({ req, res });
    return res.status(response.statusCode).json(response);
  }
}
