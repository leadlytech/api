import { createZodDto } from '@anatine/zod-nestjs';
import {
  loginSchema,
  recoverySchema,
  signUpSchema,
  verifyDataSchema,
} from './schemas';

export class SignUpDto extends createZodDto(signUpSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class RecoveryDto extends createZodDto(recoverySchema) {}
export class VerifyDataDto extends createZodDto(verifyDataSchema) {}
