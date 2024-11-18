import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const statisticsSchema = extendApi(
  z.object({
    type: z.enum(['']).optional(),
  }),
);
