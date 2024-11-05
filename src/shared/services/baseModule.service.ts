import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

import { IProps } from 'src/interfaces';

@Injectable()
export class BaseModuleService {
  constructor() {}

  extract<
    TParams = Request['params'],
    TQuery = Request['query'],
    TBody = Request['body'],
  >(
    req: Request,
    res: Response,
  ): {
    req: Request;
    props: IProps;
    headers: Record<string, any | any[]>;
    params: TParams;
    query: TQuery;
    body: TBody;
    res: Response;
  } {
    return {
      req,
      props: req['props'],
      headers: req['headers'],
      params: req.params as any,
      query: req.query as any,
      body: req.body,
      res,
    };
  }
}
