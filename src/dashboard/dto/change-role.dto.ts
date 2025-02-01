import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { RolesEnum, StatesEnum } from 'src/others/enums';

export class ChangeRoleDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;
  @IsNotEmpty()
  @IsEnum(RolesEnum)
  change_role_to: RolesEnum;
  @IsOptional()
  @IsEnum(StatesEnum)
  state: StatesEnum;
}
