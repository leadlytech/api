import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const baseListSchema = extendApi(
  z.object({
    cursorKey: z.enum(['id']).optional(),
    cursor: z.string().optional(),
    page: z.coerce.number().min(0).optional(),
    take: z.coerce.number().min(0).max(+process.env.FETCH_LIMIT).optional(),
    orderBy: z.string().optional(),
    desc: z.any().optional(),
    search: z.string().optional(),
  }),
);
