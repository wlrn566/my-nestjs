import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics/metrics.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { ChatModule } from './chat/chat.module'; // WebSocket 채팅 모듈
import { OrderModule } from './order/order.module';

/**
 * AppModule - 애플리케이션 루트 모듈
 *
 * 모든 하위 모듈을 imports에 등록하여 DI 컨테이너에 포함시킨다.
 * - MetricsModule    : Prometheus 커스텀 메트릭
 * - PrometheusModule : /metrics 엔드포인트 및 기본 메트릭
 * - ChatModule       : WebSocket 채팅 게이트웨이
 */
@Module({
  imports: [
    MetricsModule,
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true, // 기본 메트릭 활성화
      },
      defaultLabels: {
        app: 'prometheus-app', // 이름 설정
      },
      path: '/metrics',
    }),
    ChatModule, // WebSocket 채팅 모듈 등록
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    {
      // 전역 인터셉터: 모든 HTTP 요청에 대해 Prometheus 메트릭 수집
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    AppService,
  ],
})
export class AppModule {}
