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
import { EAction, IResponse } from 'src/interfaces';
import { Validate, Auth, Permission } from 'src/decorators';

@Auth()
@Controller({ path: origin })
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post()
  @Permission(`${origin}:${EAction.CREATE}`)
  @Validate(createSchema)
  async create(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.create(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Get()
  @Permission(`${origin}:${EAction.READ}`)
  @Validate(listSchema)
  async list(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.list(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Get(':id')
  @Permission(`${origin}:${EAction.READ}`)
  @Validate(findSchema)
  async findOne(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.findOne(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Patch(':id')
  @Permission(`${origin}:${EAction.UPDATE}`)
  @Validate(updateSchema, 'body')
  async update(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.update(req, res);
    return res.status(response.statusCode).json(response);
  }

  @Delete(':id')
  @Permission(`${origin}:${EAction.DELETE}`)
  @Validate(removeSchema)
  async remove(@Req() req: Request, @Res() res: Response): Promise<IResponse> {
    const response: IResponse = await this.moduleService.remove(req, res);
    return res.status(response.statusCode).json(response);
  }
}
