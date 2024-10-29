import { Module } from '@nestjs/common';
import controllers from './controllers';
import { publicServices, services } from './services';

import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';

import { UsersModule } from 'src/modules/users/module.module';

@Module({
  imports: [PrismaModule, SharedModule, UsersModule],
  controllers,
  providers: services,
  exports: publicServices,
})
export class AuthModule {}
