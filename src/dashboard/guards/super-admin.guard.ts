import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CustomRequest } from 'src/others/interfaces';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const user = context.switchToHttp().getRequest<CustomRequest>().user;
    if (!user) {
      throw new UnauthorizedException();
    }
    if (['superadmin', 'owner'].includes(user.role)) {
      return true;
    }
    return false;
  }
}
