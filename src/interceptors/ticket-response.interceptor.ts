import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TicketResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data) {
          const which = data.client ? 'client' : 'worker';
          delete data[which].id;
          delete data[which].woker_id;
          delete data[which].client_id;
          delete data[which].last_login;
          delete data[which].failed_login_attempts;
          delete data[which].account_locked_until;
          delete data[which].forgot_password;
          delete data[which].forgot_password_time;
          delete data[which].password;
        }
        return data;
      }),
    );
  }
}
