import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsEntity } from './entities/client.entity';
import { OrdersEntity } from './entities/orders.entity';
import { NotVerfiedUsersEntity } from './entities/not-verfied-users.entity';
import { UsersRoleEntity } from 'src/entities/users-role.entity';
import { CommonModule } from 'src/common/common.module';
import { WorkersModule } from 'src/workers/workers.module';
import { RatingEntity } from './entities/rate-business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientsEntity,
      OrdersEntity,
      NotVerfiedUsersEntity,
      UsersRoleEntity,
      RatingEntity,
    ]),
    CommonModule,
    WorkersModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
