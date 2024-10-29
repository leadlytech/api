import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';

export const password = z.string().min(8);

export const createSchema = extendApi(
  z.object({
    firstName: z.string(),
    lastName: z.string().optional(),
    email: z.string().email(),
    phoneNumber: z.string(),
    password,
  }),
);

export const listSchema = baseListSchema.extend({});

export const findSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);

export const updateSchema = extendApi(
  z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    password: password.optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);
