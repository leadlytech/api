import { createZodDto } from '@anatine/zod-nestjs';
import {
  loginSchema,
  signUpSchema,
  verifySchema,
  confirmSchema,
} from './schemas';

export class SignUpDto extends createZodDto(signUpSchema) {
  origin: string;
}
export class LoginDto extends createZodDto(loginSchema) {
  origin: string;
}
export class VerifyDto extends createZodDto(verifySchema) {
  origin: string;
}
export class ConfirmDto extends createZodDto(confirmSchema) {}
