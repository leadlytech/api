import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import parsePhoneNumber from 'libphonenumber-js';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  EventService,
  CacheService,
  SearchService,
  BaseHelperService,
} from 'src/shared/services';

import { EFieldType, EPaginationMode, IProps, TList } from 'src/interfaces';
import {
  IDefault,
  origin,
  TCreateRequest,
  TFindRequest,
  TListRequest,
  TRemoveRequest,
  TUpdateRequest,
} from '../dto';
import { createRecordId, generateRandomCode, hashPassword } from 'src/utils';

import { HelperService as CommunicationHelperService } from 'src/modules/communication/services';
import { EVerificationContext, EVerificationMethod } from '@prisma/client';

@Injectable()
export class HelperService extends BaseHelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventService: EventService,
    private readonly cacheService: CacheService,
    private readonly communicationService: CommunicationHelperService,
    searchService: SearchService,
  ) {
    super(searchService);
  }
  private origin = origin;
  private logger = new Logger(this.origin);
  private repository = this.prisma.user;

  verifyPhoneNumber(phone: string): string {
    const phoneNumber = parsePhoneNumber(phone);

    // Verifica o formato do telefone
    if (!phoneNumber.isValid()) {
      throw new HttpException(
        {
          message: 'ERR_INVALID_PHONE_NUMBER',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return phoneNumber.formatInternational({
      v2: true,
    });
  }

  async create(
    props: IProps,
    data: TCreateRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Creating a new "${this.origin}"`);

      const phoneNumber = this.verifyPhoneNumber(data.phoneNumber);

      // Verifica se já existe algum usuário com o email ou telefone já cadastrado

      const verify = await this.repository.findFirst({
        where: {
          tenantId: props.tenantId,
          OR: [
            {
              email: data.email,
            },
            {
              phoneNumber,
            },
          ],
        },
        select: {
          email: true,
        },
      });

      if (verify) {
        throw new HttpException(
          {
            message: `ERR_USER_EXISTS_WITH_THIS_${verify.email === data.email ? 'EMAIL' : 'PHONE'}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Cria o usuário
      const record = await this.repository.create({
        data: {
          id: createRecordId(),
          tenantId: props.tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber,
          password: await hashPassword(data.password),
        },
        select: {
          id: true,
        },
      });

      /**
       * É possível que o usuário criado tenha sido convidado em uma organização antes de criar a conta.
       * Por isso é verificado se existe algum convite pendente na tabela "members" para o respectivo usuário,
       * e então tais registros já são atualizados para serem vinculados ao novo usuário por seu ID
       */
      await this.prisma.member.updateMany({
        where: {
          inviteEmail: data.email,
        },
        data: {
          userId: record.id,
          inviteEmail: null,
        },
      });

      this.logger.log(`New "${this.origin}" created (ID: ${record.id})`);
      this.eventService.create(this.origin, record);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async list(
    props: IProps,
    data: TListRequest,
    restrictPaginationToMode?: EPaginationMode,
  ): Promise<TList<Partial<IDefault>>> {
    this.logger.log(`Listing "${this.origin}"`);
    try {
      type R = typeof this.repository;
      type F = R['fields'];
      type W = Parameters<R['findMany']>[0]['where'];
      type S = Parameters<R['findMany']>[0]['select'];
      type O = Parameters<R['findMany']>[0]['orderBy'];

      const listed = await this.listing<R, F, W, S, O>(this.repository, data, {
        logger: this.logger,
        origin: this.origin,
        restrictPaginationToMode,
        searchableFields: {
          id: EFieldType.STRING,
        },
        sortFields: ['id'],
        mergeWhere: {
          tenantId: props.tenantId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      });

      return listed;
    } catch (err) {
      throw err;
    }
  }

  async findOne(
    props: IProps,
    data: TFindRequest,
    renew = false,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Retrieving a single "${this.origin}"`);

      type R = typeof this.repository;
      type RType = NonNullable<Awaited<ReturnType<R['findUniqueOrThrow']>>>;
      let record: Partial<RType> = null;

      if (!renew) {
        record = await this.cacheService.get(this.origin, data.id);
      }

      if (!record) {
        record = await this.repository.findUniqueOrThrow({
          where: { id: data.id, tenantId: props.tenantId },
        });

        if (!renew) {
          await this.cacheService.set(this.origin, record.id, record);
        }
      }

      this.logger.log(`One "${this.origin}" was retrieved (ID: ${record.id})`);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async update(
    props: IProps,
    id: string,
    data: TUpdateRequest,
  ): Promise<Partial<IDefault>> {
    try {
      this.logger.log(`Updating a "${this.origin}"`);

      let phoneNumber: string | undefined = undefined;
      if (data.phoneNumber) {
        phoneNumber = this.verifyPhoneNumber(data.phoneNumber);
      }

      if (data.email || data.phoneNumber) {
        const verify = await this.repository.findFirst({
          where: {
            tenantId: props.tenantId,
            OR: [
              {
                email: data.email,
              },
              {
                phoneNumber,
              },
            ],
          },
          select: {
            email: true,
          },
        });

        if (verify) {
          throw new HttpException(
            {
              message: `ERR_USER_EXISTS_WITH_THIS_${verify.email === data.email ? 'EMAIL' : 'PHONE'}`,
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        // TODO: Criar processo de envio de confirmação de número
      }

      const record = await this.repository.update({
        where: { id, tenantId: props.tenantId },
        data: {
          ...data,
          phoneNumber,
          password: data.password
            ? await hashPassword(data.password)
            : undefined,
        },
      });

      this.logger.log(`One "${this.origin}" was updated (ID: ${record.id})`);
      this.eventService.update(this.origin, record);
      await this.cacheService.del(this.origin, record.id);

      return record;
    } catch (err) {
      throw err;
    }
  }

  async remove(props: IProps, data: TRemoveRequest): Promise<void> {
    try {
      this.logger.log(`Deleting a "${this.origin}"`);
      const record = await this.repository.delete({
        where: { id: data.id, tenantId: props.tenantId },
      });

      this.logger.log(`One "${this.origin}" was deleted (ID: ${record.id})`);
      this.eventService.remove(this.origin, record);
      await this.cacheService.del(this.origin, record.id);
    } catch (err) {
      throw err;
    }
  }

  async sendVerification(
    props: IProps,
    userId: string,
    context: EVerificationContext,
    method: EVerificationMethod,
  ) {
    try {
      const user = await this.findOne(props, {
        id: userId,
      });

      // Verifica se o campo que está tentando ser verificado já não está confirmado
      if (context === EVerificationContext.CONFIRM) {
        if (
          (user.emailVerifiedAt && method === EVerificationMethod.EMAIL) ||
          (user.phoneNumberVerifiedAt && method === EVerificationMethod.PHONE)
        ) {
          throw new HttpException(
            {
              message: 'ERR_CONTENT_VERIFIED',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Verifica se já foi enviada alguma verificação do tipo que ainda esteja ativa
      const verify = await this.prisma.verification.findFirst({
        where: {
          userId,
          context,
          method,
          expireAt: {
            gt: new Date(),
          },
        },
      });

      // Se algum registro for encontrado, então ainda existe uma solicitação válida
      if (verify) {
        throw new HttpException(
          {
            message: 'ERR_VERIFICATION_ALREADY_SEND',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const expireAt = new Date();
      expireAt.setHours(expireAt.getHours() + 1);

      const newVerification = await this.prisma.verification.create({
        data: {
          id: createRecordId(),
          userId,
          code: generateRandomCode(6),
          context,
          method,
          expireAt,
        },
        select: {
          code: true,
        },
      });

      switch (method) {
        case EVerificationMethod.EMAIL:
          await this.communicationService.sendEmail(props.tenantId, {
            to: user.email,
            subject: 'Código de confirmação',
            html: `<p>O seu código é <strong>${newVerification.code}</strong></p>`,
          });
          break;
        case EVerificationMethod.PHONE:
          await this.communicationService.sendSMS(props.tenantId, {
            to: user.phoneNumber,
            text: `O seu código é ${newVerification.code}`,
          });
      }
    } catch (err) {
      throw err;
    }
  }

  async confirmCodeVerification(config: {
    code: string;
    newPassword?: string;
  }): Promise<boolean> {
    try {
      const verification = await this.prisma.verification.findUniqueOrThrow({
        where: {
          code: config.code,
        },
        select: {
          id: true,
          userId: true,
          context: true,
          method: true,
        },
      });

      if (
        verification.context === EVerificationContext.RECOVERY &&
        !config.newPassword
      ) {
        throw new HttpException(
          { message: 'ERR_NEW_PASSWORD_MISSING' },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.repository.update({
        where: {
          id: verification.userId,
        },
        data: {
          ...(verification.method === EVerificationMethod.EMAIL
            ? { emailVerifiedAt: new Date() }
            : { phoneNumberVerifiedAt: new Date() }),
          ...(verification.context === EVerificationContext.RECOVERY
            ? {
                password: await hashPassword(config.newPassword),
              }
            : undefined),
        },
      });

      await this.prisma.verification.deleteMany({
        where: {
          OR: [
            {
              id: verification.id,
            },
            {
              userId: verification.userId,
              method: verification.method,
            },
          ],
        },
      });

      await this.cacheService.del(this.origin, verification.userId);

      return true;
    } catch (err) {
      throw err;
    }
  }
}
