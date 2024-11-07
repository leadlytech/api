import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards';
import { IAuthConfig } from 'src/interfaces';

export function Auth(config?: IAuthConfig) {
  return applyDecorators(
    SetMetadata('authConfig', config),
    UseGuards(AuthGuard),
  );
}

export function Permission(key: string, restrict?: boolean) {
  return applyDecorators(
    SetMetadata('permissionConfig', {
      key,
      restrict,
    }),
    // UseGuards(AuthGuard),
  );
}
