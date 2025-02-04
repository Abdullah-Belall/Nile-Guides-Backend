import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTicketsDto } from 'src/clients/dto/users-ticket.dto';
import { UpdateUserDto } from 'src/clients/dto/update-user.dto';
import { ClientsTicketsEntity } from 'src/clients/entities/client-tickets.entity';
import { ClientsEntity } from 'src/clients/entities/client.entity';
import { AdminsEntity } from 'src/dashboard/entities/admins.entity';
import { WorkersEntity } from 'src/workers/entities/worker.entity';
import { WorkersTicketsEntity } from 'src/workers/entities/workers-tickets.entity';
import { Repository } from 'typeorm';
import { StatusEnum } from 'src/others/enums';
import { UpdateTicketDto } from 'src/dashboard/dto/update-ticket.dto';
import { OrdersEntity } from 'src/clients/entities/orders.entity';
import {
  DoneResponceInterface,
  SearchFilterInterface,
} from 'src/others/interfaces';

@Injectable()
export class CommonService {
  constructor(
    @InjectRepository(ClientsEntity)
    private readonly clientsRepo: Repository<ClientsEntity>,
    @InjectRepository(ClientsTicketsEntity)
    private readonly clientsTicketsRepo: Repository<ClientsTicketsEntity>,
    @InjectRepository(AdminsEntity)
    private readonly adminsRepo: Repository<AdminsEntity>,
    @InjectRepository(WorkersEntity)
    private readonly workersRepo: Repository<WorkersEntity>,
    @InjectRepository(WorkersTicketsEntity)
    private readonly workersTicketsRepo: Repository<WorkersTicketsEntity>,
    @InjectRepository(OrdersEntity)
    private readonly ordersRepo: Repository<OrdersEntity>,
  ) {}
  async usersRepoHandle(
    repo: 'clients' | 'workers' | 'admins',
    action: 'delete' | 'save',
    user: any,
  ): Promise<void> {
    const selectedRepo = this.getRepositoryByName(repo);
    try {
      if (action === 'delete') {
        await selectedRepo.delete(user.id);
      } else if (action === 'save') {
        const userReady = selectedRepo.create(user);
        await selectedRepo.save(userReady);
      } else {
        throw new InternalServerErrorException(`Invalid action: ${action}`);
      }
    } catch (err) {
      throw new InternalServerErrorException(
        `Problem with usersRepoHandle: ${action} action failed`,
      );
    }
  }
  async updateUser(
    repo: 'clients' | 'workers' | 'admins',
    updateUserDto: UpdateUserDto,
  ): Promise<DoneResponceInterface> {
    const selectedRepo = this.getRepositoryByName(repo);
    try {
      await selectedRepo.update(updateUserDto.id, updateUserDto);
    } catch {
      throw new InternalServerErrorException('problem with updateUser');
    }
    return {
      done: true,
      message: `updated info successfully`,
    };
  }
  async findUserByEmail(
    repo: 'clients' | 'workers' | 'admins',
    value: string,
    isNeedPass: boolean,
  ): Promise<ClientsEntity | AdminsEntity | WorkersEntity> {
    const selectedRepo = this.getRepositoryByName(repo);
    const user = selectedRepo.createQueryBuilder('user');
    isNeedPass ? user.addSelect('user.password') : '';
    user.andWhere(`user.email = :value`, { value: value });
    return await user.getOne();
  }
  async makeUserTicket(
    TicketsRepo: 'clientsTickets' | 'workersTickets',
    email: string,
    userTicketsDto: UserTicketsDto,
  ): Promise<DoneResponceInterface> {
    const slicedName: any = TicketsRepo.slice(0, 7);
    const selectedRepo = this.getRepositoryByName(TicketsRepo);
    const user = await this.findUserByEmail(slicedName, email, false);
    if (!user)
      throw new BadRequestException(
        `no ${TicketsRepo.slice(0, 6)} found with this info`,
      );
    const ticket = selectedRepo.create({
      ...userTicketsDto,
      [slicedName.slice(0, -1)]: user,
    });
    try {
      await selectedRepo.save(ticket);
    } catch {
      throw new InternalServerErrorException('error with makeUserTicket');
    }
    return {
      done: true,
      message: 'Your report sent successfully.',
    };
  }
  async userTickets(
    page: number = 1,
    TicketsRepo: 'clientsTickets' | 'workersTickets',
    email: string,
    status?: StatusEnum,
  ): Promise<SearchFilterInterface> {
    if (isNaN(page) || page < 1)
      throw new BadRequestException(`page cannot be => ${page}`);
    const slicedName: any = TicketsRepo.slice(0, 7);
    const selectedRepo = this.getRepositoryByName(TicketsRepo);
    const user = await this.findUserByEmail(slicedName, email, false);
    if (!user)
      throw new BadRequestException(
        `no ${slicedName.slice(0, -1)} found with this info`,
      );
    const tickets = selectedRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect(`ticket.${slicedName.slice(0, -1)}`, 'user')
      .andWhere(`user.email = :value`, { value: email });
    if (status) {
      tickets.andWhere(`ticket.status = :statusValue`, { statusValue: status });
    }
    tickets.orderBy('ticket.created_at', 'DESC');
    tickets.skip((page - 1) * 20).take(20);
    const [selectedTickets, total] = await tickets.getManyAndCount();
    return {
      data: selectedTickets,
      total,
      page: +page,
      lastPage: Math.ceil(total / 20),
    };
  }
  async allUsersTickets(
    TicketsRepo: 'clientsTickets' | 'workersTickets',
    page: number = 1,
    status?: StatusEnum,
    createdAt?: 'today' | 'week' | 'month',
    doneAt?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    if (isNaN(page) || page < 1)
      throw new BadRequestException(`page cannot be => ${page}`);
    const allowedStatus = ['done', 'pending', 'cancelled'];
    if (status && !allowedStatus.includes(status))
      throw new BadRequestException(
        `status must be one of three done , pending , cancelled`,
      );
    const validTimeFilters = ['today', 'week', 'month'];
    if (
      (createdAt && !validTimeFilters.includes(createdAt)) ||
      (doneAt && !validTimeFilters.includes(doneAt))
    ) {
      throw new BadRequestException(
        `${createdAt ? 'createdAt' : 'doneAt'} filter must be 'today' | 'week' | 'month'`,
      );
    }
    const slicedName: any = TicketsRepo.slice(0, 6);
    const selectedRepo = this.getRepositoryByName(TicketsRepo);
    const repo = selectedRepo.createQueryBuilder('ticket');
    if (createdAt) {
      const date = this.applyDateFilter(createdAt);
      if (date)
        repo.andWhere(`ticket.created_at >= :created_at`, { created_at: date });
    }
    if (doneAt) {
      const date = this.applyDateFilter(doneAt);
      if (date) repo.andWhere(`ticket.done_at >= :done_at`, { done_at: date });
    }
    status ? repo.andWhere(`ticket.status = :value`, { value: status }) : '';
    repo.skip((page - 1) * 20).take(20);
    repo.orderBy('ticket.created_at', 'DESC');
    const [tickets, total] = await repo
      .leftJoinAndSelect(`ticket.${slicedName}`, slicedName)
      .getManyAndCount();
    return {
      data: tickets,
      total,
      page: +page,
      lastPage: Math.ceil(total / 20),
    };
  }
  async updateTicket(
    TicketsRepo: 'clientsTickets' | 'workersTickets',
    ticketId: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<DoneResponceInterface> {
    const selectedRepo = this.getRepositoryByName(TicketsRepo);
    const ticket = await selectedRepo.findOne({
      where: { id: ticketId },
    });
    if (!ticket)
      throw new BadRequestException(`cannot find ticket with id ${ticketId}`);
    ticket.status = updateTicketDto.status;
    updateTicketDto.status === 'done' ? (ticket.done_at = new Date()) : '';
    await selectedRepo.update(ticketId, ticket);
    return {
      done: true,
      message: `ticket status updated successfully`,
    };
  }
  async allUsersByRepo(
    repo: 'clients' | 'workers' | 'admins',
    page: number = 1,
    gender?: 'male' | 'female',
    minAge?: number,
    maxAge?: number,
    createdat?: 'today' | 'week' | 'month',
    updatedat?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    const selectedRepo = this.getRepositoryByName(repo);
    if (isNaN(page) || page < 1)
      throw new BadRequestException(`page cannot be => ${page}`);
    const validGender = ['male', 'female'];
    const validTimeFilters = ['today', 'week', 'month'];
    if (gender && !validGender.includes(gender))
      throw new BadRequestException(`Invalid gender: ${gender}.`);
    if ((minAge && minAge < 18) || (minAge && minAge > 99))
      throw new BadRequestException(`invalid minAge: ${minAge}.`);
    if ((maxAge && maxAge < 18) || (maxAge && maxAge > 99))
      throw new BadRequestException(`invalid maxAge: ${maxAge}.`);
    const validateTimeFilter = (filter: string | undefined) => {
      if (filter && !validTimeFilters.includes(filter))
        throw new BadRequestException(`Invalid time filter: ${filter}.`);
    };
    validateTimeFilter(createdat);
    validateTimeFilter(updatedat);
    const repository = selectedRepo.createQueryBuilder('user');
    if (createdat) {
      const date = this.applyDateFilter(createdat);
      if (date)
        repository.andWhere(`ticket.created_at >= :created_at`, {
          created_at: date,
        });
    }
    if (updatedat) {
      const date = this.applyDateFilter(updatedat);
      if (date)
        repository.andWhere(`ticket.updated_at >= :updated_at`, {
          updated_at: date,
        });
    }
    if (gender) repository.andWhere('user.gender = :gender', { gender });
    if (minAge) repository.andWhere('user.age >= :minAge', { minAge });
    if (maxAge) repository.andWhere('user.age <= :maxAge', { maxAge });
    repository.skip((page - 1) * 20).take(20);
    repository.orderBy('user.created_at', 'DESC');
    const [users, total] = await repository.getManyAndCount();
    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / 20),
    };
  }
  async allOrders(
    page: number = 1,
    created_at?: 'today' | 'week' | 'month',
    updated_at?: 'today' | 'week' | 'month',
    clientEmail?: string,
    workerEmail?: string,
    isAdmin?: boolean,
    needWorker?: boolean,
    needClient?: boolean,
  ): Promise<SearchFilterInterface> {
    if (isNaN(page) || page < 1)
      throw new BadRequestException(`page cannot be => ${page}`);
    const validTimeFilters = ['today', 'week', 'month'];
    if (
      (created_at && !validTimeFilters.includes(created_at)) ||
      (updated_at && !validTimeFilters.includes(updated_at))
    )
      throw new BadRequestException(
        `${created_at ? 'created_at' : 'updated_at'} filter must be 'today' | 'week' | 'month'`,
      );
    const repo = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.business', 'business');
    if (needWorker) {
      repo.leftJoinAndSelect('business.worker', 'worker');
    }
    if (needClient) {
      repo.leftJoinAndSelect('order.client', 'client');
    }
    if (clientEmail)
      repo
        .leftJoin('order.client', 'client')
        .addSelect('client.email')
        .andWhere('client.email = :email', { email: clientEmail });
    if (workerEmail)
      repo
        .leftJoin('business.worker', 'worker')
        .addSelect('worker.email')
        .andWhere('worker.email = :email', { email: workerEmail });
    if (isAdmin)
      repo
        .leftJoinAndSelect('order.client', 'client')
        .leftJoinAndSelect('business.worker', 'worker');
    if (created_at) {
      const date = this.applyDateFilter(created_at);
      if (date)
        repo.andWhere(`order.created_at >= :created_at`, { created_at: date });
    }
    if (updated_at) {
      const date = this.applyDateFilter(updated_at);
      if (date)
        repo.andWhere(`order.updated_at >= :updated_at`, { updated_at: date });
    }
    repo.orderBy('order.created_at', 'DESC');
    const [orders, total] = await repo
      .skip((page - 1) * 20)
      .take(20)
      .getManyAndCount();
    return {
      data: orders,
      total,
      page: +page,
      lastPage: Math.ceil(total / 20),
    };
  }
  private getRepositoryByName(
    repo:
      | 'clients'
      | 'workers'
      | 'admins'
      | 'clientsTickets'
      | 'workersTickets',
  ): Repository<any> | null {
    switch (repo) {
      case 'clients':
        return this.clientsRepo;
      case 'workers':
        return this.workersRepo;
      case 'admins':
        return this.adminsRepo;
      case 'clientsTickets':
        return this.clientsTicketsRepo;
      case 'workersTickets':
        return this.workersTicketsRepo;
      default:
        throw new InternalServerErrorException(
          `Invalid repository name: ${repo}`,
        );
    }
  }
  applyDateFilter(filter: string): Date {
    const now = new Date();
    let date: Date;
    switch (filter) {
      case 'today':
        date = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        date = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        date = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }
    return date;
  }
}
