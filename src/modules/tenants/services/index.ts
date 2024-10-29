import { ModuleService } from './module.service';
import { HelperService } from './helper.service';

export { ModuleService, HelperService };
export const publicServices = [HelperService];
export const services = [...publicServices, ModuleService];
