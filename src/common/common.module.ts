import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsEntity } from 'src/clients/entities/client.entity';
import { ClientsTicketsEntity } from 'src/clients/entities/client-tickets.entity';
import { AdminsEntity } from 'src/dashboard/entities/admins.entity';
import { WorkersEntity } from 'src/workers/entities/worker.entity';
import { WorkersTicketsEntity } from 'src/workers/entities/workers-tickets.entity';
import { OrdersEntity } from 'src/clients/entities/orders.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientsEntity,
      ClientsTicketsEntity,
      AdminsEntity,
      WorkersEntity,
      WorkersTicketsEntity,
      OrdersEntity,
    ]),
  ],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
