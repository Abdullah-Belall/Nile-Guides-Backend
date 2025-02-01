import { BusinessEntity } from 'src/workers/entities/business.entity';
import { ClientsEntity } from '../entities/client.entity';
import { StatusEnum } from 'src/others/enums';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  client: ClientsEntity;
  business: BusinessEntity;
  @IsString()
  @IsNotEmpty()
  from: string;
  @IsString()
  @IsNotEmpty()
  to: string;
  @IsString()
  @IsNotEmpty()
  day: string;
  worker_accept: StatusEnum;
  client_cancel: boolean;
  client_paid: number;
  company_paid: number;
}
