import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';
import { EStepType } from '@prisma/client';

export const stepSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  type: z.enum([
    EStepType.START,
    EStepType.PAGE,
    EStepType.WEBHOOK,
    EStepType.REDIRECT,
  ]),
  config: z.record(z.any()),
  data: z.record(z.any()),
});

export const edgeSchema = z.object({
  id: z.string().trim(),
  originId: z.string().trim(),
  destinyId: z.string().trim(),
});

export const createSchema = extendApi(
  z.object({
    name: z.string().trim(),
    description: z.string().trim().optional(),
    steps: z.array(stepSchema).optional(),
    edges: z.array(edgeSchema).optional(),
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

export const updateSchema = extendApi(
  z.object({
    name: z.string().trim().optional(),
    description: z.string().trim().optional(),
    steps: z.array(stepSchema).optional(),
    edges: z.array(edgeSchema).optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);
