import { IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { StatusEnum } from 'src/others/enums';

export class ChangeBusinessStatusDto {
  @IsNotEmpty()
  @IsIn(['done', 'cancelled'])
  changeTo: StatusEnum;
  @IsNotEmpty()
  @IsString()
  message: string;
}
