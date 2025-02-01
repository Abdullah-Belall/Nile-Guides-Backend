import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerfiyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  @Length(6, 6)
  verification_code: string;
}
