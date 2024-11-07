import { createZodDto } from '@anatine/zod-nestjs';
import { newOrgSchema } from './schemas';

export class NewOrgDto extends createZodDto(newOrgSchema) {}
