import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const newOrgSchema = extendApi(
  z.object({
    name: z.string().trim(),
  }),
);
