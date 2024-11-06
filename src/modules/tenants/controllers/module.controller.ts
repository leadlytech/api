import { Controller, Get, Post, Patch, Delete, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

import { ModuleService } from '../services';
import {
  createSchema,
  findSchema,
  listSchema,
  origin,
  removeSchema,
  updateSchema,
} from '../dto';
import { IResponse } from 'src/interfaces';
import { Auth } from 'src/decorators';
import { BaseModuleController } from 'src/shared/services';

@Auth({
  onlySystemKey: true,
})
@Controller({ path: origin })
export class ModuleController extends BaseModuleController {
  constructor(private readonly moduleService: ModuleService) {
    super();
  }

  @Post()
  async create(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.create(
      this.validate(req, res, createSchema),
    );
    return res.status(response.statusCode).json(response);
  }

  @Get()
  async list(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.list(
      this.validate(req, res, listSchema),
    );
    return res.status(response.statusCode).json(response);
  }

  @Get('public')
  @Auth({
    skip: true,
  })
  async public(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.public({ req, res });
    return res.status(response.statusCode).json(response);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.findOne(
      this.validate(req, res, findSchema),
    );
    return res.status(response.statusCode).json(response);
  }

  @Patch(':id')
  async update(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.update(
      this.validate(req, res, updateSchema),
    );
    return res.status(response.statusCode).json(response);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.remove(
      this.validate(req, res, removeSchema),
    );
    return res.status(response.statusCode).json(response);
  }
}
