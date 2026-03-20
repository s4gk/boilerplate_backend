import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Este decorador te permite sacar el usuario del request fácilmente
// En vez de hacer req.user.id, usas @CurrentUser() user
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si pides un campo específico: @CurrentUser('id')
    if (data) {
      return user?.[data];
    }

    // Si no, retorna todo el usuario
    return user;
  },
);
