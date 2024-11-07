import { User } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { NewOrgDto } from './classes';

export const origin = EOriginRoutes.ACCOUNT;

// Default
export type IDefault = User;

// New Org
export type TNewOrgRequest = NewOrgDto;
export type TNewOrgResponse = IResponse<Partial<IDefault>>;
