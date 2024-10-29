import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';

export const createSchema = extendApi(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    value: z.string(),
    restrict: z.boolean().optional(),
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
    name: z.string().optional(),
    description: z.string().optional(),
    value: z.string().optional(),
    restrict: z.boolean().optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);
