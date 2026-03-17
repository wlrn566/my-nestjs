import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

const metricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'url'],
  }),
  makeCounterProvider({
    name: 'http_response_status_total',
    help: 'Total number of HTTP responses by status code',
    labelNames: ['method', 'url', 'statusCode'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP 요청 처리 시간',
    labelNames: ['method', 'url'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 3, 5],
  }),
];

@Module({
  providers: [MetricsService, ...metricsProviders],
  exports: [...metricsProviders],
})
export class MetricsModule {}
