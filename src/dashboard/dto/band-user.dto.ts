import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class BandUserDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;
  @IsNotEmpty()
  @IsString()
  reason: string;
}
