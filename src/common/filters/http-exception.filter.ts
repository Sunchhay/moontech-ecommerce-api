import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();

        const status =
            exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const payload: any = {
            statusCode: status,
            path: req.url,
            timestamp: new Date().toISOString(),
            message:
                exception?.response?.message ||
                exception?.message ||
                (status === 500 ? 'Internal server error' : undefined),
        };
        if (process.env.NODE_ENV !== 'production') payload.stack = exception?.stack;

        res.status(status).json(payload);
    }
}
