import { ModuleService } from './module.service';

export { ModuleService };
export const publicServices = [];
export const services = [...publicServices, ModuleService];
