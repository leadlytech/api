import { createZodDto } from '@anatine/zod-nestjs';
import { updateMeSchema, membershipSchema } from './schemas';

export class UpdateMeDto extends createZodDto(updateMeSchema) {}
export class MembershipDto extends createZodDto(membershipSchema) {}
