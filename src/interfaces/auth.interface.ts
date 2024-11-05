export enum EAuthType {
  SYSTEM = 'system',
  USER = 'user',
  API = 'api',
}

export interface IProps {
  tenantId: string;
  auth?: {
    entityId?: string;
    type: EAuthType;
  };
}

export class JwtDto {
  userId: string;
  readonly iat?: number;
  readonly exp?: number;
}

export interface IAuthConfig {
  skip?: boolean;
  onlySystemKey?: boolean;
  blockAPIKey?: boolean;
}

export enum EAction {
  MANAGE = 'manage',
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}
