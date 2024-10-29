import { createZodDto } from '@anatine/zod-nestjs';
import {
  createSchema,
  listSchema,
  findSchema,
  updateSchema,
  removeSchema,
} from './schemas';

export class CreateDto extends createZodDto(createSchema) {
  organizationId: string;
}
export class ListDto extends createZodDto(listSchema) {
  organizationId: string;
}
export class FindDto extends createZodDto(findSchema) {
  organizationId: string;
}
export class UpdateDto extends createZodDto(updateSchema) {
  organizationId: string;
}
export class RemoveDto extends createZodDto(removeSchema) {
  organizationId: string;
}
