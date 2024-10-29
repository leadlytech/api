import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ModuleService } from '../services/module.service';
import { IResponse } from 'src/interfaces';

@Controller({ version: VERSION_NEUTRAL })
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Get()
  healthCheck(): IResponse {
    return this.moduleService.healthCheck();
  }
}
