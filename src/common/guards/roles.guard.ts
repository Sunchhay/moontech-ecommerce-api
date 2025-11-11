import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export function Roles(...roles: string[]) {
    // usage: @SetMetadata(ROLES_KEY, ['ADMIN'])
    const { SetMetadata } = require('@nestjs/common');
    return SetMetadata(ROLES_KEY, roles);
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }
    canActivate(ctx: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required?.length) return true;
        const { user } = ctx.switchToHttp().getRequest();
        return required.includes(user?.role);
    }
}
