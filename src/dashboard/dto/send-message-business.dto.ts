import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageBusinessDto {
  @IsNotEmpty()
  @IsString()
  message: string;
}
