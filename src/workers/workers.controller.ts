import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import { User } from 'src/decorators/user.decorator';
import { WorkersGuard } from './guards/workers.guard';
import { CommonService } from 'src/common/common.service';
import { UserTicketsDto } from 'src/clients/dto/users-ticket.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { StatesEnum, StatusEnum } from 'src/others/enums';
import { OrderChoiceDto } from './dto/order-choice.dto';
import {
  DoneResponceInterface,
  SearchFilterInterface,
} from 'src/others/interfaces';

@Controller('workers')
@UseGuards(WorkersGuard)
export class WorkersController {
  constructor(
    private readonly workersService: WorkersService,
    private readonly commonService: CommonService,
  ) {}
  @Get('services-info')
  async getServiceInfo() {
    return await this.workersService.ServiceInfo();
  }
  @Post('ticket')
  async makeWorkerTicket(
    @User() { email }: { email: string; role: string },
    @Body() userTicketsDto: UserTicketsDto,
  ): Promise<DoneResponceInterface> {
    return await this.commonService.makeUserTicket(
      'workersTickets',
      email,
      userTicketsDto,
    );
  }
  @Get('tickets')
  async workerTickets(
    @User() { email }: { email: string; role: string },
    @Query('page') page: number,
    @Query('status') status: StatusEnum,
  ): Promise<SearchFilterInterface> {
    return await this.commonService.userTickets(
      page,
      'workersTickets',
      email,
      status,
    );
  }
  @Post('business')
  async pushBusiness(
    @User() worker: any,
    @Body() createBusinessDto: CreateBusinessDto,
  ): Promise<DoneResponceInterface> {
    return await this.workersService.pushBusiness(
      worker.email,
      createBusinessDto,
    );
  }
  @Patch('business/:id')
  async updateBusiness(
    @User() worker: any,
    @Param('id', new ParseUUIDPipe()) businessId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ): Promise<DoneResponceInterface> {
    return await this.workersService.workerUpdateBusiness(
      worker.email,
      businessId,
      updateBusinessDto,
    );
  }
  @Delete('business/:id')
  async workerDeleteBusiness(
    @User() worker: any,
    @Param('id', new ParseUUIDPipe()) businessId: string,
  ): Promise<DoneResponceInterface> {
    return await this.workersService.workerDeleteBusiness(
      worker.email,
      businessId,
    );
  }
  @Get('business')
  async workerBusiness(
    @User() worker: any,
    @Query('page') page?: number,
    @Query('state') state?: StatesEnum,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('admin_accept') admin_accept?: StatusEnum,
    @Query('created_at') created_at?: 'today' | 'week' | 'month',
    @Query('updated_at') updated_at?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    return await this.workersService.allBusiness(
      page,
      state,
      minPrice,
      maxPrice,
      admin_accept,
      created_at,
      updated_at,
      worker.email,
    );
  }
  @Get('business/:id')
  async workerOneBusiness(
    @User() worker: any,
    @Param('id', new ParseUUIDPipe()) businessId: string,
  ): Promise<any> {
    return await this.workersService.getWorkerOneBusiness({
      businessId,
      workerEmail: worker.email,
    });
  }
  @Patch('order/:id')
  async workerChoiceForOrder(
    @User() worker: any,
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() { choice }: OrderChoiceDto,
  ): Promise<DoneResponceInterface> {
    return await this.workersService.workerChoiceForOrder(
      worker.email,
      orderId,
      choice,
    );
  }
  @Get('orders')
  async workerOrders(
    @User() worker: any,
    @Query('page') page?: number,
    @Query('created_at') created_at?: 'today' | 'week' | 'month',
    @Query('updated_at') updated_at?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    return await this.workersService.workerOrders(
      worker.email,
      page,
      created_at,
      updated_at,
    );
  }
}
