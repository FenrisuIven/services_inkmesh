import { Catch, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, of } from 'rxjs';

@Catch()
export class AllExceptionsRpcFilter implements RpcExceptionFilter<any> {
  catch(exception: any): Observable<any> {
    console.error('[RPC Filter] Caught exception:', exception);

    const error =
      exception instanceof RpcException
        ? exception.getError()
        : { message: exception.message || 'Internal server error', };

    return of({
      success: false,
      error: error,
      timestamp: new Date().toISOString(),
    });
  }
}
