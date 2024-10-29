import { User } from '@prisma/client';
import { IResponse } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { LoginDto, RecoveryDto, SignUpDto, VerifyDto } from './classes';

export const origin = EOriginRoutes.AUTH;

// Default
export interface IDefault extends User {}

// SignUp
export type TSignUpRequest = SignUpDto;
export type TSignUpResponse = IResponse<Partial<IDefault>>;

// Login
export type TLoginRequest = LoginDto;
export type TLoginResponse = IResponse<Partial<IDefault>>;

// SignUp
export type TRecoveryRequest = RecoveryDto;
export type TRecoveryResponse = IResponse<Partial<IDefault>>;

// Login
export type TVerifyRequest = VerifyDto;
export type TVerifyResponse = IResponse<Partial<IDefault>>;
