import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket 게이트웨이
 *
 * @WebSocketGateway 옵션:
 *   - port: 3031 → HTTP 서버(3030)와 별도 포트로 WebSocket 리슨
 *   - namespace: '/chat' → 이 게이트웨이는 /chat 네임스페이스만 처리
 *   - cors: 모든 출처 허용 (개발용)
 */
@WebSocketGateway(3031, {
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  /** NestJS 로거: 클래스 이름을 컨텍스트로 사용 */
  private readonly logger = new Logger(ChatGateway.name);

  /**
   * @WebSocketServer() 데코레이터로 socket.io Server 인스턴스 주입
   * 이 객체를 통해 연결된 모든 클라이언트에게 이벤트를 emit 할 수 있음
   */
  @WebSocketServer()
  server: Server;

  // ---------------------------------------------------------------------------
  // 라이프사이클 훅
  // ---------------------------------------------------------------------------

  /**
   * 게이트웨이 초기화 완료 시 호출
   * @param server - 초기화된 socket.io Server 인스턴스
   */
  afterInit(server: Server) {
    server.on('error', (error) => {
      this.logger.error(`WebSocket 서버 에러: ${error.message}`, error.stack);
    });
    this.logger.log(
      `WebSocket 게이트웨이 초기화 완료 (포트: 3031, 네임스페이스: /chat)`,
    );
  }

  /**
   * 클라이언트가 WebSocket 연결 시 호출
   * @param client - 연결된 소켓 클라이언트
   */
  handleConnection(client: Socket) {
    this.logger.log(`클라이언트 연결: ${client.id}`);

    // 방금 연결된 클라이언트에게만 환영 메시지 전송
    client.emit('connected', {
      message: '채팅 서버에 연결되었습니다.',
      clientId: client.id,
    });
  }

  /**
   * 클라이언트가 WebSocket 연결 해제 시 호출
   * @param client - 연결 해제된 소켓 클라이언트
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`클라이언트 해제: ${client.id}`);
  }

  // ---------------------------------------------------------------------------
  // 이벤트 핸들러
  // ---------------------------------------------------------------------------

  /**
   * 'sendMessage' 이벤트 처리 - 전체 브로드캐스트
   *
   * 클라이언트가 { username, message } 형태의 페이로드로 'sendMessage'를 emit하면
   * 연결된 '모든' 클라이언트에게 'receiveMessage' 이벤트로 재전송
   *
   * @param payload - { username: string; message: string }
   * @param client  - 메시지를 보낸 소켓 클라이언트
   */
  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() payload: { username: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`[전체] ${payload.username}: ${payload.message}`);

    // server.emit → 네임스페이스에 연결된 모든 클라이언트에게 전송 (발신자 포함)
    this.server.emit('receiveMessage', {
      clientId: client.id,
      username: payload.username,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 'joinRoom' 이벤트 처리 - 특정 방 입장
   *
   * 클라이언트가 { room, username } 을 emit하면 해당 방에 join하고
   * 같은 방의 모든 클라이언트에게 입장 알림을 전송
   *
   * @param payload - { room: string; username: string }
   * @param client  - 입장하는 소켓 클라이언트
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() payload: { room: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    // socket.io의 room 기능으로 해당 방에 클라이언트를 추가
    client.join(payload.room);
    this.logger.log(`[방 입장] ${payload.username} → ${payload.room}`);

    // 같은 방(room)의 모든 클라이언트에게 입장 알림 전송
    this.server.to(payload.room).emit('roomMessage', {
      type: 'JOIN',
      username: payload.username,
      room: payload.room,
      message: `${payload.username}님이 입장했습니다.`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 'leaveRoom' 이벤트 처리 - 특정 방 퇴장
   *
   * 클라이언트가 { room, username } 을 emit하면 해당 방에서 leave하고
   * 남은 클라이언트들에게 퇴장 알림을 전송
   *
   * @param payload - { room: string; username: string }
   * @param client  - 퇴장하는 소켓 클라이언트
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() payload: { room: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 방에서 클라이언트 제거
    client.leave(payload.room);
    this.logger.log(`[방 퇴장] ${payload.username} ← ${payload.room}`);

    // 퇴장 후 남아있는 클라이언트들에게 퇴장 알림 전송
    this.server.to(payload.room).emit('roomMessage', {
      type: 'LEAVE',
      username: payload.username,
      room: payload.room,
      message: `${payload.username}님이 퇴장했습니다.`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 'sendRoomMessage' 이벤트 처리 - 방 내 메시지 전송
   *
   * 특정 방에 있는 클라이언트들에게만 메시지 전달
   *
   * @param payload - { room: string; username: string; message: string }
   * @param client  - 메시지를 보낸 소켓 클라이언트
   */
  @SubscribeMessage('sendRoomMessage')
  handleRoomMessage(
    @MessageBody() payload: { room: string; username: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `[방 메시지] ${payload.room} | ${payload.username}: ${payload.message}`,
    );

    // server.to(room).emit → 특정 방에 있는 클라이언트에게만 전송 (발신자 포함)
    this.server.to(payload.room).emit('roomMessage', {
      type: 'MESSAGE',
      clientId: client.id,
      username: payload.username,
      room: payload.room,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }
}
