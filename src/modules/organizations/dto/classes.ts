import { createZodDto } from '@anatine/zod-nestjs';
import {
  createSchema,
  listSchema,
  findSchema,
  updateSchema,
  removeSchema,
} from './schemas';

export class CreateDto extends createZodDto(createSchema) {}
export class ListDto extends createZodDto(listSchema) {}
export class FindDto extends createZodDto(findSchema) {}
export class UpdateDto extends createZodDto(updateSchema) {}
export class RemoveDto extends createZodDto(removeSchema) {}
