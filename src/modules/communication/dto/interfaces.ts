import { User } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { LoginDto, SignUpDto } from './classes';

export const origin = EOriginRoutes.ACCOUNT;

// Default
export type IDefault = User;

// SignUp
export type TSignUpRequest = SignUpDto;
export type TSignUpResponse = IResponse<Partial<IDefault>>;

// Login
export type TLoginRequest = LoginDto;
export type TLoginResponse = IResponse<Partial<IDefault>>;
