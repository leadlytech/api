import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseListSchema } from 'src/modules/app/dto';
import { EPlanRecurrence, EPlanStatus } from '@prisma/client';

const planStatusEnum = z.enum([
  EPlanStatus.ACTIVE,
  EPlanStatus.PRIVATE,
  EPlanStatus.DISABLED,
]);

const planRecurrenceEnum = z
  .enum([
    EPlanRecurrence.MONTHLY,
    EPlanRecurrence.QUARTERLY,
    EPlanRecurrence.SEMMONLY,
    EPlanRecurrence.YEARLY,
  ])
  .nullable();

export const createSchema = extendApi(
  z.object({
    status: planStatusEnum.optional(),
    name: z.string().trim(),
    description: z.string().trim().optional(),
    amount: z.number().nullable().optional(),
    recurrence: planRecurrenceEnum.optional(),
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
    status: planStatusEnum.optional(),
    name: z.string().trim().optional(),
    description: z.string().trim().optional(),
    amount: z.number().nullable().optional(),
    recurrence: planRecurrenceEnum.optional(),
  }),
);

export const removeSchema = extendApi(
  z.object({
    id: z.string().trim(),
  }),
);
