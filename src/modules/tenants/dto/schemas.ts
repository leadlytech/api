import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';

export const createSchema = extendApi(
  z.object({
    name: z.string(),
    domain: z.string(),
    smtp: z
      .object({
        host: z.string(),
        port: z.number(),
        user: z.string(),
        pass: z.string(),
      })
      .optional(),
    smsDevKey: z.string().optional(),
    pushInPayToken: z.string().optional(),
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
    domain: z.string().optional(),
    smtp: z
      .object({
        host: z.string().optional(),
        port: z.number().optional(),
        user: z.string().optional(),
        pass: z.string().optional(),
      })
      .optional(),
    smsDevKey: z.string().optional(),
    pushInPayToken: z.string().optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);
