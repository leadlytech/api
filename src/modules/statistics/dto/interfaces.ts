import { Funnel } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { StatisticsDto } from './classes';

export const origin = EOriginRoutes.STATISTICS;

// Default
export type IDefault = Funnel;

// Get
export type TStatisticsRequest = StatisticsDto;
export type TStatisticsResponse = IResponse<any>;
