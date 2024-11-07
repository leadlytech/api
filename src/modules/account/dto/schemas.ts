import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const membershipSchema = extendApi(
  z.object({
    organizationId: z.string().trim(),
    action: z.enum(['ACCEPT', 'LEAVE']),
  }),
);
