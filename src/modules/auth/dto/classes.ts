import { createZodDto } from '@anatine/zod-nestjs';
import {
  loginSchema,
  recoverySchema,
  signUpSchema,
  verifySchema,
} from './schemas';

export class SignUpDto extends createZodDto(signUpSchema) {
  origin: string;
}
export class LoginDto extends createZodDto(loginSchema) {
  origin: string;
}
export class RecoveryDto extends createZodDto(recoverySchema) {
  origin: string;
}
export class VerifyDto extends createZodDto(verifySchema) {}
