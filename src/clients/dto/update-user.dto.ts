import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from './register.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @IsOptional()
  @IsString()
  state: string;
}
