import { IsEnum, IsIn, IsNotEmpty } from 'class-validator';
import { StatusEnum } from 'src/others/enums';

export class UpdateTicketDto {
  @IsNotEmpty()
  ticket_id: string;
  @IsIn(['client', 'worker'])
  type: string;
  @IsEnum(StatusEnum)
  status: StatusEnum;
}
