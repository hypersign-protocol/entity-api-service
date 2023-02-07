import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../Enum/roles.enum';
import { ROLES_KEY } from '../customDecorator/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => {
     
    const result=user.permissions?.includes(role) 
      if(!result){
         throw new ForbiddenException([`You do not have the required [${requiredRoles}] roles to access this resource`])
      }
      return result
  });
  }
}