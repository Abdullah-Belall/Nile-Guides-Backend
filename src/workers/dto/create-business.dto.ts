import { LangLevelEnum, StatesEnum, StatusEnum } from 'src/others/enums';
import { WorkersEntity } from '../entities/worker.entity';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBusinessDto {
  worker: WorkersEntity;
  admin_accept: StatusEnum;
  raters_counter: number;
  rate: string;
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsNotEmpty()
  @IsString()
  description: string;
  @IsNotEmpty()
  @IsString()
  language: string;
  @IsEnum(StatesEnum)
  state: StatesEnum;
  @IsEnum(LangLevelEnum)
  language_level: LangLevelEnum;
  @IsNotEmpty()
  @IsNumber()
  price: number;
  @IsNotEmpty()
  @IsString()
  image: string;
  @IsOptional()
  @IsBoolean()
  pause: boolean;
}
