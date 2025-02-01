import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkersEntity } from './entities/worker.entity';
import { BusinessEntity } from './entities/business.entity';
import { CommonModule } from 'src/common/common.module';
import { OrdersEntity } from 'src/clients/entities/orders.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkersEntity, BusinessEntity, OrdersEntity]),
    CommonModule,
  ],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
