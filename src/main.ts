import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io'; // socket.io 어댑터

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * WebSocket 어댑터 설정
   * NestJS 기본 어댑터 대신 socket.io 어댑터를 사용한다.
   * ChatGateway에서 Socket, Server 타입을 사용할 수 있게 해준다.
   */
  app.useWebSocketAdapter(new IoAdapter(app));

  // HTTP 서버는 3030 포트, WebSocket 서버는 ChatGateway에서 3031 포트 사용
  await app.listen(3030);
}
bootstrap();
