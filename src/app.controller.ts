import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { LoginDto } from './clients/dto/login.dto';
import { User } from './decorators/user.decorator';
import { UpdateUserDto } from './clients/dto/update-user.dto';
import { AuthGuard } from './guards/auth.guard';
import { ForgotPassDto } from './clients/dto/forgot-pass.dto';
import { VerfiyEmailDto } from './clients/dto/veriy-email.dto';
import { Response } from 'express';
import { WorkersService } from './workers/workers.service';
import { BusinessResponseInterceptor } from './interceptors/business-response.interceptor';
import { LangLevelEnum, StatesEnum } from './others/enums';
import { UserResponseInterceptor } from './interceptors/user-response.interceptor';
import {
  DoneResponceInterface,
  SearchFilterInterface,
  TokenInterface,
} from './others/interfaces';
import { BusinessEntity } from './workers/entities/business.entity';
import { ClientsEntity } from './clients/entities/client.entity';
import { AdminsEntity } from './dashboard/entities/admins.entity';
import { WorkersEntity } from './workers/entities/worker.entity';
import { RefreshGuard } from './guards/refresh.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workersService: WorkersService,
  ) {}
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenInterface> {
    return await this.appService.login(loginDto, response);
  }
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @User() { email }: { email: string; role: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.appService.logout(email, response);
  }
  @Get('new-access-token')
  @UseGuards(RefreshGuard)
  async newAccessToken(@User() { email }: any) {
    return await this.appService.newAccessToken(email);
  }
  @Post('forgot-password')
  async forgotPass(
    @Body() { email }: ForgotPassDto,
  ): Promise<DoneResponceInterface> {
    return await this.appService.forgotPass(email);
  }
  @Post('confirm-email-for-pass')
  async verfiyPassCode(
    @Body() { email, verification_code }: VerfiyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenInterface> {
    return await this.appService.verfiyPassCode(
      email,
      verification_code,
      response,
    );
  }
  @Get('user-role')
  @UseGuards(AuthGuard)
  async knowUserRole(@User() { email }: any): Promise<{
    role: string;
  }> {
    return await this.appService.knowUserRole(email);
  }
  @Patch('update-user')
  @UseGuards(AuthGuard)
  async updateUser(
    @User() { email }: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<DoneResponceInterface> {
    return await this.appService.updateUser(email, updateUserDto);
  }

  @Get('home')
  async homePage(
    @Query('page') page: number,
    @Query('language') language?: string,
    @Query('language_level') language_level?: LangLevelEnum,
    @Query('state') state?: StatesEnum,
    @Query('minRate') minRate?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('created_at') created_at?: 'today' | 'week' | 'month',
    @Query('updated_at') updated_at?: 'today' | 'week' | 'month',
    @Query('gender') gender?: 'male' | 'female',
  ): Promise<SearchFilterInterface> {
    return await this.appService.homePage(
      page,
      language,
      language_level,
      state,
      minRate,
      minPrice,
      maxPrice,
      created_at,
      updated_at,
      gender,
    );
  }
  @Get('business/:id')
  @UseInterceptors(BusinessResponseInterceptor)
  async getOneBusiness(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<BusinessEntity> {
    return await this.workersService.getBusiness(id, true);
  }
  @Get('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(UserResponseInterceptor)
  async profile(
    @User() { email }: { email: string; role: string },
  ): Promise<ClientsEntity | AdminsEntity | WorkersEntity> {
    return await this.appService.profile(email);
  }
  @Get('reviews/:id')
  async GetBusinessReviews(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('page') page: number,
    @Query('mostRated') mostRated: boolean = false,
  ) {
    return await this.appService.GetBusinessReviews(id, page, mostRated);
  }
}
