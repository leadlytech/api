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
import { Validate, Auth } from 'src/decorators';

@Auth({
  onlySystemKey: true,
})
@Controller({ path: origin })
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post()
  @Validate(createSchema)
  async create(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.create(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Get()
  @Validate(listSchema)
  async list(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.list(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Get('public')
  @Auth({
    skip: true,
  })
  async public(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.public(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Get(':id')
  @Validate(findSchema)
  async findOne(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.findOne(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Patch(':id')
  @Validate(updateSchema, 'body')
  async update(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.update(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Delete(':id')
  @Validate(removeSchema)
  async remove(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.remove(req, res);
    return res.status(response.statusCode).json(response);
  }
}
