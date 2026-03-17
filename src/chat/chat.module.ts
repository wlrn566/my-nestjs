import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

/**
 * ChatModule
 *
 * WebSocket 채팅 기능을 담당하는 모듈.
 * ChatGateway를 providers에 등록하면 NestJS가 자동으로
 * WebSocket 서버를 초기화하고 이벤트 핸들러를 연결한다.
 */
@Module({
  providers: [
    ChatGateway, // WebSocket 게이트웨이 등록
  ],
})
export class ChatModule {}
