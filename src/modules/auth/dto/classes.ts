import { createZodDto } from '@anatine/zod-nestjs';
import {
  loginSchema,
  recoverySchema,
  signUpSchema,
  verifySchema,
} from './schemas';

export class SignUpDto extends createZodDto(signUpSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class RecoveryDto extends createZodDto(recoverySchema) {}
export class VerifyDto extends createZodDto(verifySchema) {}
