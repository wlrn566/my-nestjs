import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { finalize, Observable, tap } from 'rxjs';

// MetricsInterceptor는 HTTP 요청과 응답을 가로채어 Prometheus 메트릭을 수집하는 인터셉터
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    // HTTP 요청 카운터
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,

    // HTTP 응답 상태 코드 카운터
    @InjectMetric('http_response_status_total')
    private readonly statusCodeCounter: Counter<string>,

    // 요청 지속 시간 히스토그램
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.route?.path || request.url;

    if (url.startsWith('/metrics')) {
      return next.handle();
    }

    // 요청 시작 시 타이머 시작
    const endTimer = this.requestDuration.startTimer({ method, url });

    // 요청 카운터 증가
    this.requestCounter.inc({ method, url });

    return next.handle().pipe(
      tap({
        // 요청이 성공적으로 처리된 후 상태 코드 카운터 증가 및 타이머 종료
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          this.statusCodeCounter.inc({
            method,
            url,
            statusCode: statusCode.toString(),
          });
        },
        // 요청 처리 중 예외가 발생한 경우 상태 코드 카운터 증가 및 타이머 종료
        error: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          this.statusCodeCounter.inc({
            method,
            url,
            statusCode: statusCode.toString(),
          });
        },
      }),
      finalize(() => {
        endTimer();
      }),
    );
  }
}
