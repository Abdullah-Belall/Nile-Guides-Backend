import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppService } from 'src/app.service';
import { StatesEnum, StatusEnum } from 'src/others/enums';
import { WorkersService } from 'src/workers/workers.service';
import { UsersRoleEntity } from 'src/entities/users-role.entity';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CommonService } from 'src/common/common.service';
import sendMessage from 'src/send-message';
import {
  DoneResponceInterface,
  SearchFilterInterface,
} from 'src/others/interfaces';
import { ClientsEntity } from 'src/clients/entities/client.entity';
import { AdminsEntity } from './entities/admins.entity';
import { WorkersEntity } from 'src/workers/entities/worker.entity';
import { BusinessEntity } from '@app/workers/entities/business.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UsersRoleEntity)
    private readonly usersRoleRepo: Repository<UsersRoleEntity>,
    @Inject(forwardRef(() => AppService))
    private readonly appService: AppService,
    private readonly workersService: WorkersService,
    private readonly commonService: CommonService,
  ) {}
  //* This file is fixed from (Exciptions)
  async getBusiness(id: string): Promise<BusinessEntity> {
    return await this.workersService.getBusiness(id, true, true);
  }
  async changeRole(
    adminEmail: string,
    userEmail: string,
    changeRoleTo: string,
    state?: StatesEnum,
  ): Promise<DoneResponceInterface> {
    if (changeRoleTo !== 'client' && !state)
      throw new BadRequestException(
        'You must insert state if you want to change role to worker.',
      );
    const admin = await this.checkAdminRights(adminEmail);
    const user: any = await this.appService.findOneInAllRepos(userEmail, true);
    if (!user) throw new NotFoundException('No user found with this info.');
    if (user.is_banded)
      throw new ForbiddenException('This email address has band.');
    const adminRole = admin.role;
    const userRole = user.role;
    const allowedRoles = ['client', 'worker', 'admin', 'superadmin'];
    if (!allowedRoles.includes(changeRoleTo))
      throw new ForbiddenException(
        `You cannot change role to be ${changeRoleTo}.`,
      );
    if (changeRoleTo === userRole)
      throw new BadRequestException(`This user is already a ${changeRoleTo}.`);
    if (userRole === 'owner')
      throw new ForbiddenException('you cannot change owner role.');
    if (adminRole === userRole)
      throw new ForbiddenException(
        'You cannot change role to user with the same role as you.',
      );
    if (adminRole === 'admin' && userRole === 'superadmin')
      throw new ForbiddenException(
        'You cannot change role to user with a higher role than you.',
      );
    await this.appService.updateRole(user, changeRoleTo, state);
    return {
      done: true,
      message: `user role changed from ${userRole} to ${changeRoleTo}.`,
    };
  }
  async bandUser(
    adminEmail: string,
    userEmail: string,
    reason: string,
  ): Promise<any> {
    const user: any = await this.appService.findOneInAllRepos(userEmail, false);
    if (!user) throw new NotFoundException('No user found with this email.');
    if (user && user.is_banded)
      throw new ForbiddenException('This email address has a band already.');
    const admin = await this.checkAdminRights(adminEmail);
    if (user.role === 'owner')
      throw new ForbiddenException('You cannot band owner.');
    if (admin.role === user.role)
      throw new ForbiddenException(
        'You cannot band a user with the same role as you.',
      );
    user.is_banded = true;
    user.band_reason = reason;
    user.band_by = adminEmail;

    const repo = ['client', 'worker'].includes(user.role)
      ? `${user.role}s`
      : `admins`;
    await this.commonService.updateUser(repo as any, user);
    if (user.role === 'worker') {
      await this.workersService.disableWorkerPosts(userEmail);
    }
    return {
      done: true,
      message: `User with email ${userEmail} is banded successfully.`,
    };
  }
  async getUsersTickets(
    ticketType: 'clients' | 'workers',
    adminEmail: string,
    page: number = 1,
    status?: StatusEnum,
    createdAt?: 'today' | 'week' | 'month',
    doneAt?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    await this.checkAdminRights(adminEmail);
    return await this.commonService.allUsersTickets(
      ticketType === 'clients' ? 'clientsTickets' : 'workersTickets',
      page,
      status,
      createdAt,
      doneAt,
    );
  }
  async findUser(
    adminEmail: string,
    userEmail: string,
  ): Promise<
    | ClientsEntity
    | AdminsEntity
    | WorkersEntity
    | {
        user: null;
        message: string;
      }
  > {
    await this.checkAdminRights(adminEmail);
    const user = await this.appService.findOneInAllRepos(userEmail, false);
    if (!user) throw new NotFoundException('No user found with this info.');
    return user;
  }
  async getClientTickets(
    adminEmail: string,
    clientEmail: string,
    page: number,
  ): Promise<SearchFilterInterface> {
    await this.checkAdminRights(adminEmail);
    return await this.commonService.userTickets(
      page,
      'clientsTickets',
      clientEmail,
    );
  }
  async getWorkerTickets(
    adminEmail: string,
    workerEmail: string,
    page: number,
  ): Promise<SearchFilterInterface> {
    await this.checkAdminRights(adminEmail);
    return await this.commonService.userTickets(
      page,
      'workersTickets',
      workerEmail,
    );
  }
  async updateTicketStatus(
    adminEmail: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<DoneResponceInterface> {
    await this.checkAdminRights(adminEmail);
    return await this.commonService.updateTicket(
      updateTicketDto.type === 'client' ? 'clientsTickets' : 'workersTickets',
      updateTicketDto.ticket_id,
      updateTicketDto,
    );
  }
  async findUsers(
    adminEmail: string,
    type: 'clients' | 'workers' | 'admins',
    page: number = 1,
    gender?: 'male' | 'female',
    minAge?: number,
    maxAge?: number,
    createdat?: 'today' | 'week' | 'month',
    updatedat?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    await this.checkAdminRights(adminEmail);
    const allowed = ['clients', 'workers'];
    return await this.commonService.allUsersByRepo(
      !allowed.includes(type) ? 'admins' : type,
      page,
      gender,
      minAge,
      maxAge,
      createdat,
      updatedat,
    );
  }
  async getAllBusiness(
    adminEmail: string,
    page?: number,
    state?: StatesEnum,
    minPrice?: number,
    maxPrice?: number,
    admin_accept?: StatusEnum,
    created_at?: 'today' | 'week' | 'month',
    updated_at?: 'today' | 'week' | 'month',
    status?: 'pending' | 'done' | 'cancelled',
    workerEmail?: string,
  ): Promise<SearchFilterInterface> {
    await this.checkAdminRights(adminEmail);
    return this.workersService.allBusiness(
      page,
      state,
      minPrice,
      maxPrice,
      admin_accept,
      created_at,
      updated_at,
      workerEmail,
      true,
      status,
    );
  }
  async changeBusinessStatus(
    adminEmail: string,
    businessId: string,
    changeTo: StatusEnum,
    message: string,
  ): Promise<DoneResponceInterface> {
    await this.checkAdminRights(adminEmail);
    const business = await this.workersService.getBusiness(
      businessId,
      true,
      true,
    );
    if (business.worker.is_banded)
      throw new ForbiddenException(
        'You cannot change status for a business with a banded worker.',
      );
    await this.workersService.updateBusinessStatus(
      businessId,
      changeTo,
      message,
    );
    return {
      done: true,
      message: `business with id ${businessId} is now ${changeTo === 'done' ? 'active' : 'not active'}`,
    };
  }
  async sendMessageToWorkerAboutBusiness(
    adminEmail: string,
    businessId: string,
    message: string,
  ): Promise<DoneResponceInterface> {
    await this.checkAdminRights(adminEmail);
    const business = await this.workersService.getBusiness(
      businessId,
      true,
      true,
    );
    if (!business)
      throw new BadRequestException(`No business found with id ${businessId}`);
    await sendMessage(business.worker.email, 'business', `<h3>${message}</h3>`);
    return {
      done: true,
      message: `Your message sended to the worker successfully.`,
    };
  }
  async deleteUserFromRepo(role: string, user: any): Promise<void> {
    if (role === 'client') {
      await this.commonService.usersRepoHandle('clients', 'delete', user);
    } else if (role === 'worker') {
      await this.commonService.usersRepoHandle('workers', 'delete', user);
    } else {
      await this.commonService.usersRepoHandle('admins', 'delete', user);
    }
  }
  private async checkAdminRights(
    adminEmail: string,
  ): Promise<ClientsEntity | AdminsEntity | WorkersEntity> {
    const admin = await this.commonService.findUserByEmail(
      'admins',
      adminEmail,
      false,
    );
    if (!admin)
      throw new UnauthorizedException('no admin found with this info');
    return admin;
  }
}
