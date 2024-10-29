import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { services } from './services';

@Module({
  imports: [PrismaModule],
  providers: services,
  exports: services,
})
export class SharedModule {}
