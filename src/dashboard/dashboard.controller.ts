import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User } from 'src/decorators/user.decorator';
import { AdminGuard } from './guards/admin.guard';
import { ChangeRoleDto } from './dto/change-role.dto';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { BandUserDto } from './dto/band-user.dto';
import { GenderEnum, StatesEnum, StatusEnum } from 'src/others/enums';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CommonService } from 'src/common/common.service';
import { ChangeBusinessStatusDto } from './dto/change-business-status.dto';
import { SendMessageBusinessDto } from './dto/send-message-business.dto';
import {
  DoneResponceInterface,
  SearchFilterInterface,
} from 'src/others/interfaces';
import { ClientsEntity } from 'src/clients/entities/client.entity';
import { AdminsEntity } from './entities/admins.entity';
import { WorkersEntity } from 'src/workers/entities/worker.entity';
import { BusinessEntity } from '@app/workers/entities/business.entity';
import { BusinessResponseInterceptor } from '@app/interceptors/business-response.interceptor';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly commonService: CommonService,
  ) {}
  @Post('change-user-role')
  @UseGuards(AdminGuard)
  async changeRole(
    @User() admin: any,
    @Body() { user_email, change_role_to, state }: ChangeRoleDto,
  ): Promise<DoneResponceInterface> {
    return await this.dashboardService.changeRole(
      admin.email,
      user_email,
      change_role_to,
      state,
    );
  }
  @Post('band-user')
  @UseGuards(SuperAdminGuard)
  async bandUser(
    @User() admin: any,
    @Body() { user_email, reason }: BandUserDto,
  ): Promise<DoneResponceInterface> {
    return await this.dashboardService.bandUser(
      admin.email,
      user_email,
      reason,
    );
  }
  @Get('clients-tickets')
  @UseGuards(AdminGuard)
  async clientsTickets(
    @User() admin: any,
    @Query('page') page?: number,
    @Query('status') status?: StatusEnum,
    @Query('createdAt') createdAt?: 'today' | 'week' | 'month',
    @Query('doneAt') doneAt?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    return await this.dashboardService.getUsersTickets(
      'clients',
      admin.email,
      page,
      status,
      createdAt,
      doneAt,
    );
  }
  @Get('workers-tickets')
  @UseGuards(AdminGuard)
  async workersTickets(
    @User() admin: any,
    @Query('page') page?: number,
    @Query('status') status?: StatusEnum,
    @Query('createdAt') createdAt?: 'today' | 'week' | 'month',
    @Query('doneAt') doneAt?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    return await this.dashboardService.getUsersTickets(
      'workers',
      admin.email,
      page,
      status,
      createdAt,
      doneAt,
    );
  }
  @Post('find-user')
  @UseGuards(AdminGuard)
  async findUser(
    @User() admin: any,
    @Body() findUserDto: FindUserDto,
  ): Promise<
    | ClientsEntity
    | AdminsEntity
    | WorkersEntity
    | {
        user: null;
        message: string;
      }
  > {
    return await this.dashboardService.findUser(
      admin.email,
      findUserDto.user_email,
    );
  }
  @Post('client-tickets')
  @UseGuards(AdminGuard)
  async clientTicket(
    @User() admin: any,
    @Body() findUserDto: FindUserDto,
    @Query('page') page: number,
  ): Promise<SearchFilterInterface> {
    return await this.dashboardService.getClientTickets(
      admin.email,
      findUserDto.user_email,
      page,
    );
  }
  @Post('worker-tickets')
  @UseGuards(AdminGuard)
  async workerTicket(
    @User() admin: any,
    @Body() findUserDto: FindUserDto,
    @Query('page') page: number,
  ): Promise<SearchFilterInterface> {
    return await this.dashboardService.getWorkerTickets(
      admin.email,
      findUserDto.user_email,
      page,
    );
  }
  @Patch('ticket')
  @UseGuards(AdminGuard)
  async updateTicketStatus(
    @User() admin: any,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<DoneResponceInterface> {
    return await this.dashboardService.updateTicketStatus(
      admin.email,
      updateTicketDto,
    );
  }
  @Get('all-users')
  @UseGuards(AdminGuard)
  async findUsers(
    @User() admin: any,
    @Query('type') type: 'clients' | 'workers' | 'admins',
    @Query('page') page?: number,
    @Query('gender') gender?: GenderEnum,
    @Query('minAge') minAge?: number,
    @Query('maxAge') maxAge?: number,
    @Query('createdAt') createdAt?: 'today' | 'week' | 'month',
    @Query('updatedAt') updatedAt?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    const allowedTypes = ['clients', 'workers', 'admins'];
    if (!allowedTypes.includes(type))
      throw new BadRequestException(
        `type query must be one of three 'clients' | 'workers' | 'admins'`,
      );
    return await this.dashboardService.findUsers(
      admin.email,
      type,
      page,
      gender,
      minAge,
      maxAge,
      createdAt,
      updatedAt,
    );
  }
  @Get('business')
  @UseGuards(AdminGuard)
  async getAllBusiness(
    @User() admin: any,
    @Query('page') page?: number,
    @Query('state') state?: StatesEnum,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('status') status?: 'pending' | 'done' | 'cancelled',
    @Query('admin_accept') admin_accept?: StatusEnum,
    @Query('created_at') created_at?: 'today' | 'week' | 'month',
    @Query('updated_at') updated_at?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    return await this.dashboardService.getAllBusiness(
      admin?.email,
      page,
      state,
      minPrice,
      maxPrice,
      admin_accept,
      created_at,
      updated_at,
      status,
    );
  }
  @Get('business/:id')
  @UseInterceptors(BusinessResponseInterceptor)
  async getOneBusiness(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<BusinessEntity> {
    return await this.dashboardService.getBusiness(id);
  }
  @Patch('business/:id')
  @UseGuards(AdminGuard)
  async changeBusinessStatus(
    @User() admin: any,
    @Param('id', new ParseUUIDPipe()) businessId: string,
    @Body() { changeTo, message }: ChangeBusinessStatusDto,
  ): Promise<DoneResponceInterface> {
    return await this.dashboardService.changeBusinessStatus(
      admin.email,
      businessId,
      changeTo,
      message,
    );
  }
  @Post('business/:id')
  @UseGuards(AdminGuard)
  async sendMessageToWorkerAboutBusiness(
    @User() admin: any,
    @Param('id', new ParseUUIDPipe()) businessId: string,
    @Body() { message }: SendMessageBusinessDto,
  ): Promise<DoneResponceInterface> {
    return await this.dashboardService.sendMessageToWorkerAboutBusiness(
      admin.email,
      businessId,
      message,
    );
  }
  @Get('orders')
  @UseGuards(AdminGuard)
  async allOrders(
    @Query('page') page?: number,
    @Query('created_at') created_at?: 'today' | 'week' | 'month',
    @Query('updated_at') updated_at?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    return await this.commonService.allOrders(
      page,
      created_at,
      updated_at,
      undefined,
      undefined,
      true,
    );
  }
  @Get('worker-business/:email')
  @UseGuards(AdminGuard)
  async workerBusiness(
    @Param('email') email: string,
    @User() admin: any,
  ): Promise<SearchFilterInterface> {
    return await this.dashboardService.getAllBusiness(
      admin.email,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      email,
    );
  }
}
