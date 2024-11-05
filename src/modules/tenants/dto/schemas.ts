import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';

const smtp = z.object({
  host: z.string().trim(),
  port: z.number(),
  user: z.string().trim(),
  pass: z.string().trim(),
  tls: z.boolean(),
});

export const createSchema = extendApi(
  z.object({
    name: z.string().trim(),
    domain: z.string().trim(),
    smtp: smtp.optional(),
    smsDevKey: z.string().trim().optional(),
    pushInPayToken: z.string().trim().optional(),
  }),
);

export const listSchema = baseListSchema.extend({});

export const findSchema = extendApi(
  z.object({
    id: z.string().trim(),
  }),
);

export const updateSchema = extendApi(
  z.object({
    name: z.string().trim().optional(),
    domain: z.string().trim().optional(),
    smtp: smtp.optional(),
    smsDevKey: z.string().trim().optional(),
    pushInPayToken: z.string().trim().optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    id: z.string().trim(),
  }),
);
