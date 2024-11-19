import { User } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { PublicFunnelDto } from './classes';

export const origin = EOriginRoutes.FUNNELS_PUBLIC;

// Default
export type IDefault = User;

// SignUp
export type TSignUpRequest = PublicFunnelDto;
export type TSignUpResponse = IResponse<Partial<IDefault>>;
