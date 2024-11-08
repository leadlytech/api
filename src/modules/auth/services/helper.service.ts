import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { EVerificationContext, EVerificationMethod } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { EventService } from 'src/shared/services';

import {
  IDefault,
  origin,
  TSignUpRequest,
  TLoginRequest,
  TVerifyRequest,
  TConfirmRequest,
} from '../dto';
import { TEnv, verifyPassword } from 'src/utils';

import { JwtDto } from 'src/interfaces';

import { HelperService as UserHelperService } from 'src/modules/users/services';
import { HelperService as TenantHelperService } from 'src/modules/tenants/services';

@Injectable()
export class HelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHelperService: UserHelperService,
    private readonly tenantHelperService: TenantHelperService,
    private readonly configService: ConfigService<TEnv>,
    private readonly eventService: EventService,
    private readonly jwtService: JwtService,
  ) {}
  private origin = origin;
  private logger = new Logger(this.origin);
  private repository = this.prisma.user;

  async signUp(data: TSignUpRequest): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Making SignUp`);

      const tenant = await this.tenantHelperService.public({
        id: data.origin,
      });

      // Cria a conta do usuário
      const payload = await this.userHelperService.create(
        { tenantId: tenant.id },
        data,
      );

      // Envia verificação de email
      // await this.userHelperService.sendVerification(
      //   { tenantId: tenant.id },
      //   payload.id,
      //   EVerificationContext.CONFIRM,
      //   EVerificationMethod.EMAIL,
      // );

      // Envia verificação de sms
      // await this.userHelperService.sendVerification(
      //   { tenantId: tenant.id },
      //   payload.id,
      //   EVerificationContext.CONFIRM,
      //   EVerificationMethod.PHONE,
      // );

      this.eventService.custom(this.origin, 'signup', payload);

      return payload;
    } catch (err) {
      throw err;
    }
  }

  async login(data: TLoginRequest): Promise<Record<string, any>> {
    try {
      this.logger.log(`Making Login...`);
      const tenant = await this.tenantHelperService.public({
        id: data.origin,
      });

      const user = await this.repository.findFirst({
        where: {
          tenantId: tenant.id,
          email: data.email,
        },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        throw new HttpException(
          {
            message: 'ERR_INVALID_CREDENTIALS',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Verifica a senha
      const verifyPass = await verifyPassword(data.password, user.password);

      if (!verifyPass) {
        throw new HttpException(
          {
            message: 'ERR_INVALID_CREDENTIALS',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const token = await this.generateToken(user.id);
      this.eventService.custom(this.origin, 'login', { userId: user.id });
      this.logger.log(`Login completed`);

      return { token };
    } catch (err) {
      throw err;
    }
  }

  async verify(data: TVerifyRequest): Promise<Record<string, any>> {
    try {
      this.logger.log(`Recovery account`);
      const tenant = await this.tenantHelperService.public({
        id: data.origin,
      });

      const user = await this.repository.findFirst({
        where: {
          email: data.email,
        },
        select: {
          id: true,
        },
      });

      if (user) {
        this.logger.log(
          `User of email "${data.email}" found, sending recovery code... (TENANT ID: ${tenant.id})`,
        );
        const verified = await this.userHelperService.sendVerification(
          {
            tenantId: tenant.id,
          },
          user.id,
          data.context,
          EVerificationMethod.EMAIL,
        );

        this.logger.log(`Recovery code sent`);

        return { verified };
      }

      this.logger.log(
        `User of email "${data.email}" not found (TENANT ID: ${tenant.id})`,
      );

      return { verified: false };
    } catch (err) {
      throw err;
    }
  }

  async confirm(data: TConfirmRequest): Promise<Record<string, any>> {
    try {
      this.logger.log(`Verifying confirmation code...`);
      const verified = await this.userHelperService.confirmCodeVerification({
        code: data.code,
      });

      this.logger.log(`Confirmation code verified`);

      return { verified };
    } catch (err) {
      throw err;
    }
  }

  private async generateToken(userId: string): Promise<string> {
    try {
      const payload: JwtDto = {
        userId,
      };
      return this.jwtService.sign(payload, {
        secret: this.configService.get<string>('SYSTEM_KEY'),
        expiresIn: this.configService.get<string>('JWT_PERIOD'),
      });
    } catch (err) {
      throw err;
    }
  }
}
