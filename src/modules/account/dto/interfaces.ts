import { User } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { UpdateMeDto, MembershipDto } from './classes';

export const origin = EOriginRoutes.ACCOUNT;

// Default
export type IDefault = User;

// Update
export type TUpdateMeRequest = UpdateMeDto;
export type TUpdateMeResponse = IResponse<Partial<IDefault>>;

// Membership Org State
export type TMembershipRequest = MembershipDto;
export type TMembershipResponse = IResponse<Partial<IDefault>>;
