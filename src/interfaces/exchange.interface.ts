import { HttpStatus } from '@nestjs/common';

export interface IResponse<T = any> {
  statusCode: number | HttpStatus;
  message?: string;
  error?: string;
  payload?: T;
}

export interface IList<T = any> {
  nextCursor?: string;
  currentPage: number;
  lastPage: number;
  count: number;
  take: number;
  current: number;
  data: Partial<T>[];
}

export interface IListOffset<T = any> {
  currentPage: number;
  lastPage: number;
  count: number;
  take: number;
  current: number;
  data: Partial<T>[];
}

export interface IListCursor<T = any> {
  nextCursor: string;
  take: number;
  current: number;
  data: Partial<T>[];
}

export type TList<T = any> = IListOffset<T> | IListCursor<T>;
