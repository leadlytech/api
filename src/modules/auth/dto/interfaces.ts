import { User } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { ConfirmDto, LoginDto, SignUpDto, VerifyDto } from './classes';

export const origin = EOriginRoutes.AUTH;

// Default
export type IDefault = User;

// SignUp
export type TSignUpRequest = SignUpDto;
export type TSignUpResponse = IResponse<Partial<IDefault>>;

// Login
export type TLoginRequest = LoginDto;
export type TLoginResponse = IResponse<Partial<IDefault>>;

// SignUp
export type TVerifyRequest = VerifyDto;
export type TVerifyResponse = IResponse<Partial<IDefault>>;

// Login
export type TConfirmRequest = ConfirmDto;
export type TConfirmResponse = IResponse<Partial<IDefault>>;
