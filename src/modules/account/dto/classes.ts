import { createZodDto } from '@anatine/zod-nestjs';
import { membershipSchema } from './schemas';

export class MembershipDto extends createZodDto(membershipSchema) {}
