import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';
import { ESolutionType } from '@prisma/client';

export const createSchema = extendApi(
  z.object({
    type: z.enum([ESolutionType.LINKS, ESolutionType.FUNNELS]),
    name: z.string().trim().optional(),
    description: z.string().trim().optional(),
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
    description: z.string().trim().optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    id: z.string().trim(),
  }),
);
