import { IsEmail, IsNotEmpty } from 'class-validator';

export class FindUserDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;
}
