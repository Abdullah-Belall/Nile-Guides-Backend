import { IsIn } from 'class-validator';

export class OrderChoiceDto {
  @IsIn(['done', 'cancelled'])
  choice: string;
}
