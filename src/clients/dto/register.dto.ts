import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GenderEnum } from 'src/others/enums';

export class RegisterDto {
  id: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(15)
  first_name: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(15)
  last_name: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @Min(18)
  @Max(90)
  @IsNumber()
  age: number;
  @IsString()
  @IsOptional()
  avatar: string;
  @IsNotEmpty()
  @IsEnum(GenderEnum)
  gender: GenderEnum;
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  password: string;
  verification_code: string;
  created_at: Date;
  last_login: Date;
  failed_login_attempts: number;
  account_locked_until: Date;
}
