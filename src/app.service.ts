import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './clients/dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { WorkersService } from './workers/workers.service';
import { UpdateUserDto } from './clients/dto/update-user.dto';
import sendMessage from './send-message';
import { LangLevelEnum, StatesEnum } from './others/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersRoleEntity } from './entities/users-role.entity';
import { Repository } from 'typeorm';
import { CommonService } from './common/common.service';
import {
  DoneResponceInterface,
  SearchFilterInterface,
  TokenInterface,
} from './others/interfaces';
import { ClientsEntity } from './clients/entities/client.entity';
import { AdminsEntity } from './dashboard/entities/admins.entity';
import { WorkersEntity } from './workers/entities/worker.entity';
import { Response } from 'express';
import { ClientsService } from './clients/clients.service';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(UsersRoleEntity)
    private readonly usersRoleRepo: Repository<UsersRoleEntity>,
    private readonly workersService: WorkersService,
    private readonly commonService: CommonService,
    private readonly clientsService: ClientsService,
  ) {}
  async login(
    { email, password }: LoginDto,
    response: Response,
  ): Promise<TokenInterface> {
    const user: any = await this.findOneInAllRepos(email, true);
    if (!user) {
      throw new UnauthorizedException(`No user found with this email address.`);
    }
    if (user.is_banded) {
      throw new ForbiddenException(
        `This email address has been banned. Check your email for details.`,
      );
    }
    if (
      user.account_locked_until &&
      user.account_locked_until.getTime() > new Date().getTime()
    ) {
      throw new ForbiddenException(
        `Your account is locked. Try again in an hour at least.`,
      );
    }
    const isTruePass = await bcrypt.compare(password, user.password);
    const condition = user.role !== 'client' && user.role !== 'worker';
    const role: any = `${user.role}s`;
    if (!isTruePass) {
      if (user.failed_login_attempts > 3) {
        const lockDuration = 60 * 60 * 1000;
        user.account_locked_until = new Date(Date.now() + lockDuration);
        user.failed_login_attempts = 0;
      }
      user.failed_login_attempts += 1;
      condition
        ? await this.commonService.updateUser('admins', user)
        : await this.commonService.updateUser(role, user);
      throw new UnauthorizedException('Incorrect password');
    }
    user.failed_login_attempts = 0;
    user.last_login = new Date();
    condition
      ? await this.commonService.updateUser('admins', user)
      : await this.commonService.updateUser(role, user);
    const access_token = this.generateAccessToken({
      email: user.email,
      role: user.role,
    });
    const refresh_token = this.generateRefreshToken({
      email: user.email,
      role: user.role,
    });
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'high',
    });
    return {
      done: true,
      access_token,
    };
  }
  async logout(
    email: string,
    response: Response,
  ): Promise<DoneResponceInterface> {
    const user: any = await this.findOneInAllRepos(email, true);
    if (!user) {
      throw new UnauthorizedException(`No user found with this email address.`);
    }
    if (user.is_banded) {
      throw new ForbiddenException(
        `This email address has been banned. Check your email for details.`,
      );
    }
    if (
      user.account_locked_until &&
      user.account_locked_until.getTime() > new Date().getTime()
    ) {
      throw new ForbiddenException(
        `Your account is locked. Try again in an hour at least.`,
      );
    }
    const refresh_token = this.generateRefreshToken({
      email: user.email,
      role: user.role,
    });
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(),
      priority: 'high',
    });
    return {
      done: true,
      message: 'You loged out successfully',
    };
  }
  async updateUser(
    email: string,
    updateUserDto: UpdateUserDto,
  ): Promise<DoneResponceInterface> {
    if (Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException(
        'You must insert one key at least to update user',
      );
    }
    if (updateUserDto.email)
      throw new BadRequestException('You cannot update email address.');
    const user: any = await this.findOneInAllRepos(email, false);
    if (!user) throw new NotFoundException('No user found with this info.');
    if (user.is_banded)
      throw new ForbiddenException('There is a band on this email address.');
    if (updateUserDto.password)
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    const condition = user.role !== 'client' && user.role !== 'worker';
    const result = condition
      ? await this.commonService.updateUser('admins', {
          ...updateUserDto,
          id: user.id,
        })
      : await this.commonService.updateUser((user.role + 's') as any, {
          ...updateUserDto,
          id: user.id,
        });
    return result;
  }
  async forgotPass(email: string): Promise<DoneResponceInterface> {
    const user = await this.checkUser(email);
    if (
      user.account_locked_until &&
      user.account_locked_until.getTime() > new Date().getTime()
    ) {
      throw new ForbiddenException(
        `Your account is locked. Try again in an hour at least.`,
      );
    }
    const code = this.generateVerificationCode();
    user.forgot_password = code;
    user.forgot_password_time = new Date();
    delete user.email;
    await this.updateUser(email, user);
    await sendMessage(
      email,
      'Confirmation code',
      `This code is vaild for 10min => ${code}`,
    );
    return {
      done: true,
      message: `confirmation message sended to your email address.`,
    };
  }
  async verfiyPassCode(
    email: string,
    code: string,
    response: Response,
  ): Promise<TokenInterface> {
    const user = await this.checkUser(email);
    const condition =
      user.forgot_password !== code ||
      user.forgot_password_time.getTime() + 600000 < new Date().getTime();
    if (condition) throw new UnauthorizedException('invaild code.');
    const access_token = this.generateAccessToken({
      email: user.email,
      role: user.role,
    });
    const refresh_token = this.generateRefreshToken({
      email: user.email,
      role: user.role,
    });
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'high',
    });
    return {
      done: true,
      access_token,
    };
  }
  async newAccessToken(email: string): Promise<TokenInterface> {
    const user = await this.usersRoleRepo.findOne({
      where: { email },
    });
    if (!user) throw new UnauthorizedException('No user found with this info.');

    if (user.is_banded)
      throw new ForbiddenException('There is a ban on your email address.');

    const access_token = this.generateAccessToken({
      email,
      role: user.role,
    });

    return {
      done: true,
      access_token,
    };
  }
  async updateRole(
    user: any,
    changeRoleTo: string,
    state?: StatesEnum,
  ): Promise<void> {
    if (changeRoleTo === 'client') {
      user.client_id = user.role === 'worker' ? user.worker_id : user.admin_id;
      if (user.role === 'worker') {
        await this.commonService.usersRepoHandle('workers', 'delete', user);
      } else {
        await this.commonService.usersRepoHandle('admins', 'delete', user);
      }
      user.role = changeRoleTo;
      await this.commonService.usersRepoHandle('clients', 'save', user);
    } else if (changeRoleTo === 'worker') {
      user.state = state;
      user.worker_id = user.role === 'client' ? user.client_id : user.admin_id;
      if (user.role === 'client') {
        await this.commonService.usersRepoHandle('clients', 'delete', user);
      } else {
        await this.commonService.usersRepoHandle('admins', 'delete', user);
      }
      user.role = changeRoleTo;
      await this.commonService.usersRepoHandle('workers', 'save', user);
    } else {
      user.state = state;
      if (user.role !== 'client' && user.role !== 'worker') {
        await this.commonService.usersRepoHandle('admins', 'delete', user);
      }
      if (user.role === 'client') {
        user.admin_id = user.client_id;
        await this.commonService.usersRepoHandle('clients', 'delete', user);
      }
      if (user.role === 'worker') {
        user.admin_id = user.worker_id;
        await this.commonService.usersRepoHandle('workers', 'delete', user);
      }
      user.role = changeRoleTo;
      await this.commonService.usersRepoHandle('admins', 'save', user);
    }
    const findHim = await this.usersRoleRepo.findOne({
      where: { email: user.email },
    });
    const changeRoleFromMainUsersTable: any = this.usersRoleRepo.create({
      ...user,
      role: changeRoleTo,
    });
    await this.usersRoleRepo.update(findHim.id, changeRoleFromMainUsersTable);
  }
  async knowUserRole(email: string): Promise<{
    role: string;
  }> {
    const user = await this.usersRoleRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException(`No user found with this info.`);
    return {
      role: user.role,
    };
  }
  async homePage(
    page: number,
    language?: string,
    language_level?: LangLevelEnum,
    state?: StatesEnum,
    minRate?: number,
    minPrice?: number,
    maxPrice?: number,
    created_at?: 'today' | 'week' | 'month',
    updated_at?: 'today' | 'week' | 'month',
    gender?: 'male' | 'female',
  ): Promise<SearchFilterInterface> {
    return await this.workersService.homePageAllBusiness(
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
  async profile(
    email: string,
  ): Promise<ClientsEntity | AdminsEntity | WorkersEntity> {
    const user = await this.findOneInAllRepos(email, false);
    if (!user) throw new UnauthorizedException(`No user found with this info`);
    if (user.is_banded) throw new ForbiddenException(`This account is banded.`);
    return user;
  }
  async findOneInAllRepos(
    email: string,
    needPass: boolean,
  ): Promise<ClientsEntity | AdminsEntity | WorkersEntity> {
    const isAdmens = await this.commonService.findUserByEmail(
      'admins',
      email,
      needPass,
    );
    if (isAdmens) return isAdmens;
    const isWorker = await this.commonService.findUserByEmail(
      'workers',
      email,
      needPass,
    );
    if (isWorker) return isWorker;
    const isClient = await this.commonService.findUserByEmail(
      'clients',
      email,
      needPass,
    );
    if (isClient) return isClient;
    return null;
  }
  async GetBusinessReviews(
    businessId: string,
    page: number = 1,
    mostRated: boolean = false,
  ) {
    return await this.clientsService.getBusinessReviews(
      businessId,
      page,
      mostRated,
    );
  }
  private generateAccessToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: '15m',
    });
  }
  private generateRefreshToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET_KEY, {
      expiresIn: '7d',
    });
  }
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  private async checkUser(email: string): Promise<any> {
    const user: any = await this.findOneInAllRepos(email, false);
    if (!user) throw new UnauthorizedException('No user found with this info.');
    if (user.is_banded)
      throw new ForbiddenException('There is a band on your email address.');
    return user;
  }
}
