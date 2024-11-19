import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const getPublicFunnelDataSchema = extendApi(
  z.object({
    id: z.string(),
  }),
);
