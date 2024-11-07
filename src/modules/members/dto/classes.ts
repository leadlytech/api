import { createZodDto } from '@anatine/zod-nestjs';
import {
  createSchema,
  listSchema,
  findSchema,
  updateSchema,
  removeSchema,
} from './schemas';
import { EMemberStatus } from '@prisma/client';

export class CreateDto extends createZodDto(createSchema) {
  organizationId: string;
  owner?: boolean;
  status?: EMemberStatus;
}
export class ListDto extends createZodDto(listSchema) {
  organizationId: string;
}
export class FindDto extends createZodDto(findSchema) {
  organizationId: string;
}
export class UpdateDto extends createZodDto(updateSchema) {
  organizationId: string;
  status?: EMemberStatus;
}
export class RemoveDto extends createZodDto(removeSchema) {
  organizationId: string;
}
