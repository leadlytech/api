import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { PrismaService } from 'src/prisma/prisma.service';

import { origin } from '../dto';

@Injectable()
export class HelperService {
  constructor(private readonly prisma: PrismaService) {}
  private origin = origin;
  private logger = new Logger(this.origin);
  private repository = this.prisma.tenant;

  async sendEmail(
    tenantId: string,
    config: {
      to: string;
      subject: string;
      text?: string;
      html?: string;
    },
  ): Promise<Record<string, any>> {
    try {
      const credentials = await this.repository.findUniqueOrThrow({
        where: {
          id: tenantId,
        },
        select: {
          domain: true,
          smtp: true,
        },
      });

      const smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
        tls: boolean;
      } = credentials.smtp as any;

      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.tls,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      const info = await transporter.sendMail({
        from: `no-reply@${credentials.domain}`,
        ...config,
      });
      return info;
    } catch (err) {
      throw err;
    }
  }

  async sendSMS(tenantId: string, config: { to: string; text: string }) {
    try {
      const credentials = await this.repository.findUniqueOrThrow({
        where: {
          id: tenantId,
        },
        select: {
          smsDevKey: true,
        },
      });

      await fetch('https://api.smsdev.com.br/v1/send', {
        method: 'POST',
        body: JSON.stringify({
          key: credentials.smsDevKey,
          type: 9,
          number: config.to,
          msg: config.text,
        }),
      });
    } catch (err) {
      throw err;
    }
  }
}
