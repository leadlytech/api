import { Controller, Res, Req, Get } from '@nestjs/common';
import { Request, Response } from 'express';

import { ModuleService } from '../services';
import { origin } from '../dto';
import { IResponse } from 'src/interfaces';
import { Auth } from 'src/decorators';

@Controller({ path: origin })
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Get()
  @Auth({
    blockAPIKey: true,
  })
  async me(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.me({ req, res });
    return res.status(response.statusCode).json(response);
  }
}
