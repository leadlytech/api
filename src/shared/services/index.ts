import { SearchService } from './search.service';
import { ErrorService } from './error.service';
import { EventService } from './event.service';
import { CacheService } from './cache.service';
import { BaseModuleService } from './baseModule.service';
import { BaseHelperService } from './baseHelper.service';

export {
  SearchService,
  ErrorService,
  EventService,
  CacheService,
  BaseModuleService,
  BaseHelperService,
};
export const services = [
  SearchService,
  ErrorService,
  EventService,
  CacheService,
  BaseModuleService,
  BaseHelperService,
];
