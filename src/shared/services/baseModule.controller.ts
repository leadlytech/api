import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { z } from 'zod';

@Injectable()
export class BaseModuleController {
  validate(
    req: Request,
    res: Response,
    schema: z.ZodObject<any>,
  ): { req: Request; res: Response } {
    try {
      const content = {
        ...req.query,
        ...req.body,
        ...req.params,
      };

      const contentParsed = schema.parse(content);
      req['content'] = { ...contentParsed, ...req.params };
      return { req, res };
    } catch (err) {
      throw new HttpException(
        {
          error: 'ERR_INVALID_FORMAT',
          payload: err,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
