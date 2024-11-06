import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

import { IProps, ITxn } from 'src/interfaces';

@Injectable()
export class BaseModuleService {
  constructor() {}

  extract<
    TParams = Request['params'],
    TQuery = Request['query'],
    TBody = Request['body'],
  >(
    txn: ITxn,
  ): {
    req: Request;
    props: IProps;
    headers: Record<string, any | any[]>;
    params: TParams;
    query: TQuery;
    body: TBody;
    res: Response;
  } {
    const { req, res } = txn;

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
