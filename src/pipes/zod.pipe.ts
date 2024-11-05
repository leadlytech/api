import {
  PipeTransform,
  ArgumentMetadata,
  Paramtype,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private validateMetadataType?: Paramtype,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      let parsedValue = value;
      if (metadata.type !== 'custom') {
        if (
          this.validateMetadataType &&
          metadata.type !== this.validateMetadataType
        ) {
          return parsedValue;
        }
        parsedValue = this.schema.parse(value);
      }
      console.log(parsedValue);
      return parsedValue;
    } catch (error) {
      throw new HttpException(
        {
          error: 'ERR_INVALID_FORMAT',
          payload: error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
