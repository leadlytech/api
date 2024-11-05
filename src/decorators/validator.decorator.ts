import { applyDecorators, Paramtype, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes';
import { z } from 'zod';

export function Validate(
  zodSchema: z.ZodObject<any>,
  validateMetadataType?: Paramtype,
) {
  console.log('DENTRO DO VALIDATE');
  return applyDecorators(
    UsePipes(new ZodValidationPipe(zodSchema, validateMetadataType)),
  );
}
