import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { RegisterDto } from './dto/register.dto';
import { VerfiyEmailDto } from './dto/veriy-email.dto';
import { ClientsGuard } from './guards/clients.guard';
import { User } from 'src/decorators/user.decorator';
import { CommonService } from 'src/common/common.service';
import { UserTicketsDto } from './dto/users-ticket.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaidDto } from './dto/paid-order.dto';
import { RateBusinessDto } from './dto/rate-business.dto';
import {
  DoneResponceInterface,
  SearchFilterInterface,
} from 'src/others/interfaces';
import { StatusEnum } from '@app/others/enums';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly commonService: CommonService,
  ) {}
  //*DONE
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<DoneResponceInterface> {
    return await this.clientsService.register(registerDto);
  }
  //*DONE
  @Post('verfiy-email')
  async verfiyEmail(
    @Body() verfiyEmailDto: VerfiyEmailDto,
  ): Promise<DoneResponceInterface> {
    return await this.clientsService.verfiyEmail(verfiyEmailDto);
  }
  @Post('ticket')
  @UseGuards(ClientsGuard)
  async makeClientTicket(
    @User() { email }: { email: string; role: string },
    @Body() userTicketsDto: UserTicketsDto,
  ): Promise<DoneResponceInterface> {
    return await this.commonService.makeUserTicket(
      'clientsTickets',
      email,
      userTicketsDto,
    );
  }
  @Get('tickets')
  @UseGuards(ClientsGuard)
  async clientTickets(
    @User() { email }: { email: string; role: string },
    @Query('page') page: number,
    @Query('status') status: StatusEnum,
  ): Promise<SearchFilterInterface> {
    return await this.commonService.userTickets(
      page,
      'clientsTickets',
      email,
      status,
    );
  }
  @Post('order/:id')
  @UseGuards(ClientsGuard)
  async Book(
    @User() client: any,
    @Param('id', new ParseUUIDPipe()) businessId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<DoneResponceInterface> {
    return await this.clientsService.Book(
      client.email,
      businessId,
      createOrderDto,
    );
  }
  @Patch('cancel-order/:id')
  @UseGuards(ClientsGuard)
  async cancelBook(
    @User() client: any,
    @Param('id', new ParseUUIDPipe()) orderId: string,
  ): Promise<DoneResponceInterface> {
    return await this.clientsService.cancelBook(client.email, orderId);
  }
  @Patch('order-paid/:id')
  @UseGuards(ClientsGuard)
  async paid(
    @User() client: any,
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() { paid }: PaidDto,
  ): Promise<DoneResponceInterface> {
    return await this.clientsService.paidConfiramtion(
      client.email,
      orderId,
      paid,
    );
  }
  @Get('orders')
  @UseGuards(ClientsGuard)
  async clientOrders(
    @User() client: any, //! add code to check clients rights
    @Query('page') page?: number,
    @Query('created_at') created_at?: 'today' | 'week' | 'month',
    @Query('updated_at') updated_at?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    return await this.commonService.allOrders(
      page,
      created_at,
      updated_at,
      client.email,
      undefined,
      undefined,
      true,
    );
  }
  @Post('rate-business/:id')
  @UseGuards(ClientsGuard)
  async rateBusiness(
    @User() client: any,
    @Param('id', new ParseUUIDPipe()) businessId: string,
    @Body() rateBusinessDto: RateBusinessDto,
  ): Promise<DoneResponceInterface> {
    return await this.clientsService.rateBusiness(
      client.email,
      businessId,
      rateBusinessDto,
    );
  }
}
