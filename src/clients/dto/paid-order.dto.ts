import { IsNotEmpty, IsNumber } from 'class-validator';

export class PaidDto {
  @IsNumber()
  @IsNotEmpty()
  paid: number;
}
