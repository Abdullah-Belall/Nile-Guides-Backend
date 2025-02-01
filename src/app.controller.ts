import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { RefreshGuard } from './guards/refresh.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workersService: WorkersService,
  ) {}
  //* DONE
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenInterface> {
    return await this.appService.login(loginDto, response);
  }
  //* DONE
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @User() { email }: { email: string; role: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.appService.logout(email, response);
  }
  //* DONE
  @Get('new-access-token')
  @UseGuards(RefreshGuard)
  async newAccessToken(@User() { email }: any) {
    return await this.appService.newAccessToken(email);
  }
  //* DONE
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
  @Post('pushImage/:type')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const type = req.params.type;
          let folder = './uploads';
          if (type === 'temporary-save') {
            folder = './temporary-uploads';
          }
          callback(null, folder);
        },
        filename: (_, file, callback) => {
          const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueSuffix);
        },
      }),
      fileFilter: (_, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('File type not supported'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!['save', 'temporary-save'].includes(type)) {
      throw new BadRequestException(
        'Invalid type parameter. Allowed values are save or temporary-save.',
      );
    }

    if (!file) {
      throw new BadRequestException(
        'No file uploaded. Please provide an image.',
      );
    }

    try {
      return {
        done: true,
        message: 'Image uploaded successfully',
        filename: file.filename,
        folder: type === 'temporary-save' ? 'temporary-uploads' : 'uploads',
      };
    } catch (err) {
      throw new InternalServerErrorException(
        'An error occurred while uploading the image.',
      );
    }
  }

  @Delete('/image/:filename/:type')
  async deleteImage(
    @Param('filename') filename: string,
    @Param('type') type: string,
  ) {
    await this.appService.deleteImage(filename, type);
    return { done: true, message: 'Image deleted successfully.' };
  }
}
