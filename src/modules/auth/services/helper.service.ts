import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from 'src/prisma/prisma.service';
import { EventService } from 'src/shared/services';

import {
  IDefault,
  origin,
  TLoginRequest,
  TRecoveryRequest,
  TSignUpRequest,
  TVerifyRequest,
} from '../dto';
import { TEnv, verifyPassword } from 'src/utils';

import { HelperService as UserHelperService } from 'src/modules/users/services';
import { JwtDto } from 'src/interfaces';
import { ConfigService } from '@nestjs/config';
import { EVerificationContext, EVerificationMethod } from '@prisma/client';

@Injectable()
export class HelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHelperService: UserHelperService,
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

      // Cria a conta do usuário
      const payload = await this.userHelperService.create(
        { tenantId: data.tenantId },
        data,
      );

      // Envia verificação de email
      await this.userHelperService.sendVerification(
        { tenantId: data.tenantId },
        payload.id,
        EVerificationContext.CONFIRM,
        EVerificationMethod.EMAIL,
      );

      // Envia verificação de sms
      // await this.userHelperService.sendVerification(
      //   { tenantId: data.tenantId },
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
      this.logger.log(`Making Login`);
      const user = await this.repository.findFirst({
        where: {
          tenantId: data.tenantId,
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

      return { token };
    } catch (err) {
      throw err;
    }
  }

  async recovery(data: TRecoveryRequest): Promise<Record<string, any>> {
    try {
      this.logger.log(`Recovery account`);
      const user = await this.repository.findFirst({
        where: {
          email: data.email,
        },
        select: {
          id: true,
        },
      });
      const verified = await this.userHelperService.sendVerification(
        {
          tenantId: data.tenantId,
        },
        user.id,
        EVerificationContext.RECOVERY,
        EVerificationMethod.EMAIL,
      );

      return { verified };
    } catch (err) {
      throw err;
    }
  }

  async verify(data: TVerifyRequest): Promise<Record<string, any>> {
    try {
      this.logger.log(`Code verification`);
      const verified = await this.userHelperService.confirmCodeVerification({
        code: data.code,
      });

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
