import { Controller, OnModuleInit } from '@nestjs/common';
import { OrderService } from './order.service';
// import { ClientKafka } from '@nestjs/microservices';

@Controller('order')
export class OrderController implements OnModuleInit {
  constructor(
    // @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly orderService: OrderService
  ) {}

  // 카프카 연결 확인
  async onModuleInit() {
    // await this.kafkaClient.connect();
  }

  // @Post('update-status')
  // async updateStatus(@Body() updateDto: { orderId: number; status: string }) {
  //   // DB에서 주문 상태 업데이트
  //   // const updatedOrder = await this.orderService.update(updateDto.orderId, updateDto.status);

  //   // // 상태 변경이 성공하면 카프카로 메시지 전송 (Event Publishing)
  //   // // emit('토픽명', '전송할 데이터')
  //   // this.kafkaClient.emit('order.status.changed', {
  //   //   orderId: updatedOrder.id,
  //   //   newStatus: updatedOrder.status,
  //   //   userId: updatedOrder.userId, // 알림 보낼 때 필요한 정보
  //   //   updatedAt: new Date().toISOString(),
  //   // });

  //   return { success: true, message: '상태 변경 및 알림 요청 완료' };
  // }
}
