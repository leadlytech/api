import { Permission } from '@prisma/client';
import { IResponse, TList } from 'src/interfaces';
import { EOriginRoutes } from 'src/routes';

import { CreateDto, ListDto, FindDto, UpdateDto, RemoveDto } from './classes';

export const origin = EOriginRoutes.PERMISSIONS;

// Default
export type IDefault = Permission;

// Create
export type TCreateRequest = CreateDto;
export type TCreateResponse = IResponse<Partial<IDefault>>;

// List
export type TListRequest = ListDto;
export type TListResponse = IResponse<TList<Partial<IDefault>>>;

// Get
export type TFindRequest = FindDto;
export type TFindResponse = IResponse<Partial<IDefault>>;

// Update
export type TUpdateRequest = UpdateDto;
export type TUpdateResponse = IResponse<Partial<IDefault>>;

// Remove
export type TRemoveRequest = RemoveDto;
export type TRemoveResponse = IResponse<Partial<IDefault>>;
