import { User } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { MembershipDto } from './classes';

export const origin = EOriginRoutes.ACCOUNT;

// Default
export type IDefault = User;

// New Org
export type TMembershipRequest = MembershipDto;
export type TMembershipResponse = IResponse<Partial<IDefault>>;
