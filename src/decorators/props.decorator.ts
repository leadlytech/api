import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Props = createParamDecorator(
  (selector: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (selector) {
      const search = request[selector];
      return search ?? undefined;
    }

    return request;
  },
);
