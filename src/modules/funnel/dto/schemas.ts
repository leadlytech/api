import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';

export const createSchema = extendApi(
  z.object({
    email: z.string().email().optional(),
  }),
);

export const listSchema = baseListSchema.extend({
  userId: z.string().optional(),
});

export const findSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);

export const updateSchema = extendApi(z.object({}));

export const removeSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);
