import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RateBusinessDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  rate: number;
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  text: string;
}
