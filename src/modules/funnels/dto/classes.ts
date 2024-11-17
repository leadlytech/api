import { createZodDto } from '@anatine/zod-nestjs';
import {
  createSchema,
  listSchema,
  findSchema,
  updateSchema,
  removeSchema,
} from './schemas';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Funnel } from '@prisma/client';

export class CreateDto extends createZodDto(createSchema) {
  id: string;
  organizationId: string;
}
export class ListDto extends createZodDto(listSchema) {
  id: string;
  organizationId: string;
}
export class FindDto extends createZodDto(findSchema) {
  id: string;
  organizationId: string;
}
export class UpdateDto extends createZodDto(updateSchema) {
  id: string;
  organizationId: string;
}
export class RemoveDto extends createZodDto(removeSchema) {
  id: string;
  organizationId: string;
}
