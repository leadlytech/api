import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';

import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { ConfigModule } from '@nestjs/config';

import { RedisModule } from '@songkeys/nestjs-redis';
// https://github.com/Songkeys/nestjs-redis

import controllers from './controllers';
import { services } from './services';

// Utils
import { envSchema } from 'src/utils';

// Modules
import { SharedModule } from 'src/shared/shared.module';
import { TenantsModule } from 'src/modules/tenants/module.module';
import { PermissionsModule } from 'src/modules/permissions/module.module';
import { ServicesModule } from 'src/modules/services/module.module';
import { PlansModule } from 'src/modules/plans/module.module';
import { UsersModule } from 'src/modules/users/module.module';
import { AuthModule } from 'src/modules/auth/module.module';
import { AccountModule } from 'src/modules/account/module.module';
import { CommunicationModule } from 'src/modules/communication/module.module';
import { OrganizationsModule } from 'src/modules/organizations/module.module';
import { MembersModule } from 'src/modules/members/module.module';
import { RolesModule } from 'src/modules/roles/module.module';
import { KeysModule } from 'src/modules/keys/module.module';

@Module({
  imports: [
    GracefulShutdownModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '.env.production'],
      expandVariables: true,
      validate: (env) => envSchema.parse(env),
    }),
    RedisModule.forRoot(
      {
        config: {
          ...(process.env.REDIS_URL
            ? {
                url: process.env.REDIS_URL,
              }
            : {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
                username: process.env.REDIS_USER,
                password: process.env.REDIS_PASS,
              }),
        },
      },
      true,
    ),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.SYSTEM_KEY,
      signOptions: { expiresIn: process.env.JWT_PERIOD },
    }),
    SharedModule,
    TenantsModule,
    PermissionsModule,
    ServicesModule,
    PlansModule,
    UsersModule,
    AuthModule,
    AccountModule,
    CommunicationModule,
    OrganizationsModule,
    MembersModule,
    RolesModule,
    KeysModule,
  ],
  controllers,
  providers: services,
})
export class AppModule {}
