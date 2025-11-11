import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
    intercept(_: ExecutionContext, next: CallHandler<T>): Observable<any> {
        return next.handle().pipe(map((data) => ({ ok: true, data })));
    }
}
