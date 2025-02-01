import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UserResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data) {
          delete data.id;
          delete data.last_login;
          delete data.failed_login_attempts;
          delete data.account_locked_until;
          delete data.forgot_password;
          delete data.forgot_password_time;
          delete data.password;
        }
        return data;
      }),
    );
  }
}
