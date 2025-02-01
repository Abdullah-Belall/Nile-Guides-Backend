import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BusinessResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data) {
          delete data.worker.id;
          delete data.worker.worker_id;
          delete data.worker.last_login;
          delete data.worker.failed_login_attempts;
          delete data.worker.account_locked_until;
          delete data.worker.forgot_password;
          delete data.worker.forgot_password_time;
          delete data.worker.password;
        }
        return data;
      }),
    );
  }
}
