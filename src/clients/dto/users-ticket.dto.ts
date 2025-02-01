import { StatusEnum } from 'src/others/enums';
import { ClientsEntity } from '../entities/client.entity';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WorkersEntity } from 'src/workers/entities/worker.entity';

export class UserTicketsDto {
  client: ClientsEntity;
  worker: WorkersEntity;
  @IsString()
  @IsNotEmpty()
  subject: string;
  @IsString()
  @IsNotEmpty()
  body: string;
  @IsString()
  @IsOptional()
  image1: string;
  @IsString()
  @IsOptional()
  image2: string;
  @IsString()
  @IsOptional()
  image3: string;
  status: StatusEnum;
}
