import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class RateBusinessDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  rate: number;
}
