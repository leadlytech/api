import { Module } from '@nestjs/common';
import { publicServices, services } from './services';

import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  providers: services,
  exports: publicServices,
})
export class CommunicationModule {}
