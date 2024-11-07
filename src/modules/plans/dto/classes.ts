import { createZodDto } from '@anatine/zod-nestjs';
import {
  createSchema,
  listSchema,
  findSchema,
  updateSchema,
  removeSchema,
} from './schemas';

export class CreateDto extends createZodDto(createSchema) {
  serviceId: string;
}
export class ListDto extends createZodDto(listSchema) {
  serviceId: string;
}
export class FindDto extends createZodDto(findSchema) {
  serviceId: string;
}
export class UpdateDto extends createZodDto(updateSchema) {
  serviceId: string;
}
export class RemoveDto extends createZodDto(removeSchema) {
  serviceId: string;
}
