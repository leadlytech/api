import { createZodDto } from '@anatine/zod-nestjs';
import { getPublicFunnelDataSchema } from './schemas';

export class PublicFunnelDto extends createZodDto(getPublicFunnelDataSchema) {}
