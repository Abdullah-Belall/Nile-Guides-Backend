import { StatusEnum } from 'src/others/enums';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WorkersEntity } from '../entities/worker.entity';

export class WorkerTicketsDto {
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
