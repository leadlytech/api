import { createZodDto } from '@anatine/zod-nestjs';
import { statisticsSchema } from './schemas';

export class StatisticsDto extends createZodDto(statisticsSchema) {
  organizationId: string;
}
