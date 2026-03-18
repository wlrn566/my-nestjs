import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
// import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // Kafka 마이크로서비스 클라이언트 설정
    // ClientsModule.register([
    //   {
    //     name: 'KAFKA_SERVICE',
    //     transport: Transport.KAFKA,
    //     options: {
    //       client: {
    //         clientId: 'nestjs-kafka-client',
    //         brokers: ['localhost:9092'],
    //       },
    //       consumer: {
    //         groupId: 'notification-producer-group'
    //       }
    //     }
    //   },
    // ])
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
