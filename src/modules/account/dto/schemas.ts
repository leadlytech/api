import { extendApi } from '@anatine/zod-openapi';
import { password } from 'src/modules/users/dto';
import { z } from 'zod';

export const updateMeSchema = extendApi(
  z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    password: password.optional(),
    newPassword: password.optional(),
  }),
);

export const membershipSchema = extendApi(
  z.object({
    organizationId: z.string().trim(),
    action: z.enum(['ACCEPT', 'LEAVE']),
  }),
);
