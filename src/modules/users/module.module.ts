import { Module } from '@nestjs/common';
import controllers from './controllers';
import { publicServices, services } from './services';

import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';

import { CommunicationModule } from 'src/modules/communication/module.module';

@Module({
  imports: [PrismaModule, SharedModule, CommunicationModule],
  controllers,
  providers: services,
  exports: publicServices,
})
export class UsersModule {}
