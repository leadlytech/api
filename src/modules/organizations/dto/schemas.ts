import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';

export const myOrgSchema = extendApi(
  z.object({
    name: z.string().trim(),
  }),
);

export const createSchema = myOrgSchema.extend({
  userId: z.string().trim(),
});

export const listSchema = baseListSchema.extend({});

export const findSchema = extendApi(
  z.object({
    organizationId: z.string().trim(),
  }),
);

export const updateSchema = extendApi(
  z.object({
    organizationId: z.string().trim(),
    name: z.string().trim().optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    organizationId: z.string().trim(),
  }),
);
