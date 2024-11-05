import { extendApi } from '@anatine/zod-openapi';
import { password } from 'src/modules/users/dto';
import { z } from 'zod';

export const signUpSchema = extendApi(
  z.object({
    firstName: z.string(),
    lastName: z.string().optional(),
    email: z.string().email(),
    phoneNumber: z.string(),
    password,
  }),
);

export const loginSchema = extendApi(
  z.object({
    email: z.string().email(),
    password,
    mfa: z
      .string()
      .length(6)
      .regex(/[0-9]{6}/)
      .nullable()
      .optional(),
  }),
);

export const recoverySchema = extendApi(
  z.object({
    email: z.string().email(),
  }),
);

export const verifySchema = extendApi(
  z.object({
    code: z.string().length(6),
    recovery: z
      .object({
        password,
      })
      .optional(),
  }),
);
