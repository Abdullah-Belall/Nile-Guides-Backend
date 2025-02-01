import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessEntity } from './entities/business.entity';
import { Not, Repository } from 'typeorm';
import { WorkersEntity } from './entities/worker.entity';
import { CommonService } from 'src/common/common.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { LangLevelEnum, StatesEnum, StatusEnum } from 'src/others/enums';
import { UpdateBusinessDto } from './dto/update-business.dto';
import sendMessage from 'src/send-message';
import { OrdersEntity } from 'src/clients/entities/orders.entity';
import {
  DoneResponceInterface,
  SearchFilterInterface,
} from 'src/others/interfaces';

const InternalServerErrorMessage =
  'There is a problem, Please try again later.';
@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(WorkersEntity)
    private readonly workersRepo: Repository<WorkersEntity>,
    @InjectRepository(OrdersEntity)
    private readonly ordersRepo: Repository<OrdersEntity>,
    private readonly commonService: CommonService,
  ) {}
  //* This file is fixed from (Exciptions)
  async ServiceInfo() {
    const data_ = await this.ordersRepo.findAndCount({
      where: {
        worker_accept: StatusEnum.DONE,
        client_cancel: false,
        client_paid: Not(0),
        company_paid: Not(0),
      },
    });
    const [data, total] = data_;
    let totalMoneyWithoutBenfits = 0;
    let totalMoneyWithBenfits = 0;
    for (let i = 0; i < data.length; i++) {
      totalMoneyWithoutBenfits += data[i].client_paid;
      totalMoneyWithBenfits += data[i].company_paid;
    }
    return {
      totalMoneyWithoutBenfits,
      totalMoneyWithBenfits,
      totalCompletedServices: total,
    };
  }
  async pushBusiness(
    workerEmail: string,
    createBusinessDto: CreateBusinessDto,
  ): Promise<DoneResponceInterface> {
    const worker = await this.commonService.findUserByEmail(
      'workers',
      workerEmail,
      false,
    );
    if (!worker)
      throw new UnauthorizedException('No worker found with this info.');
    const businessReady = this.businessRepo.create({
      ...createBusinessDto,
      worker,
    });
    try {
      await this.businessRepo.save(businessReady);
    } catch (error) {
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    return {
      done: true,
      message: `your business added successfully`,
    };
  }
  async allBusiness(
    page: number = 1,
    state?: StatesEnum,
    minPrice?: number,
    maxPrice?: number,
    admin_accept?: StatusEnum,
    created_at?: 'today' | 'week' | 'month',
    updated_at?: 'today' | 'week' | 'month',
    workerEmail?: string,
    needWorker?: boolean,
    status?: 'pending' | 'done' | 'cancelled',
  ): Promise<SearchFilterInterface> {
    if (isNaN(page) || page < 1)
      throw new BadRequestException(`page cannot be => ${page}`);
    if (state && !Object.values(StatesEnum).includes(state)) {
      throw new BadRequestException(`Invalid state value: ${state}`);
    }
    if ((minPrice && 0 >= minPrice) || (maxPrice && 0 >= maxPrice)) {
      throw new BadRequestException(
        `${minPrice ? 'minPrice' : 'maxPrice'} cannot be ${minPrice ? minPrice : maxPrice}`,
      );
    }
    if (admin_accept && !Object.values(StatusEnum).includes(admin_accept)) {
      throw new BadRequestException(
        `Invalid admin_accept value: ${admin_accept}`,
      );
    }
    const validTimeFilters = ['today', 'week', 'month'];
    if (
      (created_at && !validTimeFilters.includes(created_at)) ||
      (updated_at && !validTimeFilters.includes(updated_at))
    ) {
      throw new BadRequestException(
        `${created_at ? 'created_at' : 'update_at'} filter must be 'today' | 'week' | 'month'`,
      );
    }
    //&===============================================
    const repo = this.businessRepo
      .createQueryBuilder('one')
      .leftJoin('one.worker', 'worker')
      .select([
        'one.id',
        'one.title',
        'one.description',
        'one.language',
        'one.language_level',
        'one.state',
        'one.price',
        'one.rate',
        'one.image',
        'one.admin_accept',
        'one.created_at',
        'one.pause',
        'one.message',
        'one.updated_at',
      ]);
    state ? repo.andWhere('one.state = :state', { state }) : '';
    minPrice ? repo.andWhere('one.price >= :price', { price: minPrice }) : '';
    maxPrice ? repo.andWhere('one.price <= :price', { price: maxPrice }) : '';
    workerEmail
      ? repo.andWhere('worker.email = :email', { email: workerEmail })
      : '';
    admin_accept
      ? repo.andWhere('one.admin_accept = :value', { value: admin_accept })
      : '';
    needWorker ? repo.leftJoinAndSelect('one.worker', 'needWorker') : '';
    status ? repo.andWhere('one.admin_accept = :value', { value: status }) : '';
    if (created_at) {
      const date = this.commonService.applyDateFilter(created_at);
      if (date)
        repo.andWhere('one.created_at >= :created_at', {
          created_at: date,
        });
    }
    if (updated_at) {
      const date = this.commonService.applyDateFilter(updated_at);
      if (date)
        repo.andWhere('one.updated_at >= :updated_at', {
          updated_at: date,
        });
    }
    repo.skip((page - 1) * 20).take(20);
    repo.orderBy('one.created_at', 'DESC');
    const [business, total] = await repo.getManyAndCount();
    return {
      data: business,
      total,
      page: +page,
      lastPage: Math.ceil(total / 20),
    };
  }
  async updateBusinessStatus(
    businessId: string,
    changeTo: StatusEnum,
    message: string,
  ): Promise<void> {
    const business: any = await this.getBusiness(businessId, true, true);
    if (!business)
      throw new NotFoundException(`No business found with id ${businessId}`);
    if (business.admin_accept === changeTo)
      throw new BadRequestException(
        `This business is alreay ${changeTo === 'done' ? 'active' : 'not active'}`,
      );
    try {
      let obj: any = { admin_accept: changeTo };
      if (changeTo === 'cancelled') obj.message = message;
      if (changeTo === 'done') obj.message = null;
      await this.businessRepo.update(businessId, obj);
      await sendMessage(
        business.worker.email,
        'Business',
        `<h3>${message}</h3>`,
      );
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
  }
  async workerUpdateBusiness(
    workerEmail: string,
    businessId: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<DoneResponceInterface> {
    const business: any = await this.getBusiness(businessId, true, true);
    if (Object.keys(updateBusinessDto).length === 0)
      throw new BadRequestException(
        `You have to insert at least one value to update your business.`,
      );
    if (!business)
      throw new NotFoundException(`no business found with id ${businessId}`);
    if (business.worker.email !== workerEmail)
      throw new ForbiddenException(
        `You don't have the right to update business that you donnot own.`,
      );
    if (
      !(
        Object.keys(updateBusinessDto).length === 1 &&
        updateBusinessDto.pause !== undefined
      )
    )
      updateBusinessDto.admin_accept = StatusEnum.PENDING;

    try {
      await this.businessRepo.update(businessId, updateBusinessDto);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    return {
      done: true,
      message: `updated successfully`,
    };
  }
  async updateBusinessRate(
    businessId: string,
    update: any,
  ): Promise<DoneResponceInterface> {
    const business = await this.getBusiness(businessId, false);
    if (!business)
      throw new NotFoundException(`no business with id ${businessId}`);
    try {
      await this.businessRepo.update(businessId, { ...business, ...update });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    return {
      done: true,
      message: `updated successfully`,
    };
  }
  async workerDeleteBusiness(
    workerEmail: string,
    businessId: string,
  ): Promise<DoneResponceInterface> {
    const business: any = await this.getBusiness(businessId, true, true);
    if (!business)
      throw new NotFoundException(`no business found with id ${businessId}`);
    if (business.worker.email !== workerEmail)
      throw new ForbiddenException(
        `You don't have the right to update business that you don't own.`,
      );
    return await this.deleteBusiness(businessId);
  }
  async workerChoiceForOrder(
    workerEmail: string,
    orderId: string,
    choice: any,
  ): Promise<DoneResponceInterface> {
    const worker = await this.workersRepo.findOne({
      where: { email: workerEmail },
    });
    if (!worker)
      throw new UnauthorizedException(`No worker found with this info.`);
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['client'],
    });
    if (!order) throw new NotFoundException('No order found with this info');
    if (order.worker_accept !== 'pending') {
      throw new BadRequestException(
        `You cannot accept or cancel order after you already ${order.worker_accept === 'done' ? 'accepted' : 'canceled'}`,
      );
    }
    if (order.client_cancel === true) {
      throw new BadRequestException(
        `You cannot accept or cancel order client already cancel it.`,
      );
    }
    order.worker_accept = choice;
    try {
      await this.ordersRepo.update(orderId, order);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    await sendMessage(
      order.client.email,
      `order`,
      `the worker ${choice === 'done' ? 'confirm' : 'cancel'} your order ${choice === 'done' ? 'go to website to pay and confirm the orde' : ''}`,
    );
    return {
      done: true,
      message: `you ${choice === 'done' ? 'confirmed' : 'canceled'} the order`,
    };
  }
  async workerOrders(
    workerEmail: string,
    page?: number,
    created_at?: 'today' | 'week' | 'month',
    updated_at?: 'today' | 'week' | 'month',
  ): Promise<SearchFilterInterface> {
    const worker = await this.workersRepo.findOne({
      where: { email: workerEmail },
    });
    if (!worker)
      throw new UnauthorizedException(`No worker found with this info.`);
    return await this.commonService.allOrders(
      page,
      created_at,
      updated_at,
      undefined,
      workerEmail,
      undefined,
      undefined,
      true,
    );
  }
  async getBusinessWithOrders(
    businessId: string,
    clientEmail: string,
  ): Promise<BusinessEntity> {
    const business = await this.businessRepo
      .createQueryBuilder('business')
      .andWhere('business.id = :id', { id: businessId })
      .leftJoinAndSelect('business.orders', 'order')
      .leftJoin('order.client', 'client')
      .addSelect('client.email')
      .andWhere('client.email = :email', { email: clientEmail })
      .getOne();
    if (!business) throw new NotFoundException(`You did't order that business`);
    return business;
  }
  async homePageAllBusiness(
    page: number = 1,
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
    if (isNaN(page) || page < 1)
      throw new BadRequestException(`page cannot be => ${page}`);
    const validGenders = ['male', 'female'];
    if (gender && !validGenders.includes(gender))
      throw new BadRequestException(`gender cannot be => ${gender}`);
    if (minRate && (isNaN(minRate) || minRate < 1 || minRate > 10))
      throw new BadRequestException(`minRate cannot be => ${minRate}`);
    if (minPrice && isNaN(minPrice))
      throw new BadRequestException(`minPrice cannot be => ${minPrice}`);
    if (maxPrice && isNaN(maxPrice))
      throw new BadRequestException(`maxPrice cannot be => ${maxPrice}`);
    const validTimeFilters = ['today', 'week', 'month'];
    if (
      (created_at && !validTimeFilters.includes(created_at)) ||
      (updated_at && !validTimeFilters.includes(updated_at))
    ) {
      throw new BadRequestException(
        `${created_at ? 'created_at' : 'update_at'} filter must be 'today' | 'week' | 'month'`,
      );
    }
    if (
      language_level &&
      !Object.values(LangLevelEnum).includes(language_level)
    )
      throw new BadRequestException(
        `Invalid admin_accept value: ${language_level}`,
      );
    if (state && !Object.values(StatesEnum).includes(state))
      throw new BadRequestException(`Invalid admin_accept value: ${state}`);
    const repo = this.businessRepo
      .createQueryBuilder('business')
      .addSelect(
        `
      (COALESCE(CAST(business.rate AS FLOAT), 0) * 0.8) +
      (COALESCE(business.raters_counter, 0) * 0.06) +
      (1 / COALESCE(EXTRACT(EPOCH FROM (NOW() - business.created_at)), 1))
      `,
        'score',
      )
      .andWhere(`business.admin_accept = :done`, { done: 'done' })
      .andWhere(`business.pause = :value`, { value: false });
    language
      ? repo.andWhere(`business.language = :language`, { language })
      : '';
    language_level
      ? repo.andWhere(`business.language_level = :language_level`, {
          language_level,
        })
      : '';
    state
      ? repo.andWhere(`business.state = :state`, {
          state,
        })
      : '';
    gender
      ? repo
          .leftJoin('business.worker', 'worker')
          .addSelect('worker.gender')
          .andWhere(`worker.gender = :gender`, {
            gender,
          })
      : '';
    minRate
      ? repo.andWhere(`business.rate >= :minRate`, {
          minRate,
        })
      : '';
    minPrice
      ? repo.andWhere(`business.price >= :minPrice`, {
          minPrice,
        })
      : '';
    maxPrice
      ? repo.andWhere(`business.price <= :maxPrice`, {
          maxPrice,
        })
      : '';
    if (created_at) {
      const date = this.commonService.applyDateFilter(created_at);
      if (date)
        repo.andWhere('business.created_at >= :created_at', {
          created_at: date,
        });
    }
    if (updated_at) {
      const date = this.commonService.applyDateFilter(updated_at);
      if (date)
        repo.andWhere('business.updated_at >= :updated_at', {
          updated_at: date,
        });
    }

    const [business, total] = await repo
      .orderBy('score', 'DESC')
      .skip((page - 1) * 20)
      .take(20)
      .getManyAndCount();

    return {
      data: business,
      total,
      page: +page,
      lastPage: Math.ceil(total / 20),
    };
  }
  async getBusiness(
    businessId: string,
    needWorker: boolean,
    isAdmin: boolean = false,
  ): Promise<BusinessEntity> {
    const obj = { id: businessId, pause: false };
    if (isAdmin) delete obj.pause;
    const business_ = await this.businessRepo.findOne({
      where: obj,
      relations: needWorker ? ['worker'] : [],
    });
    if (!business_)
      throw new NotFoundException(`no business found with id => ${businessId}`);
    return business_;
  }
  async getWorkerOneBusiness({
    businessId,
    workerEmail,
  }: {
    businessId: string;
    workerEmail: string;
  }) {
    const business = await this.businessRepo.findOne({
      where: { id: businessId, worker: { email: workerEmail } },
    });
    if (!business) throw new NotFoundException();
    return business;
  }
  async deleteBusiness(businessId: string): Promise<DoneResponceInterface> {
    const business = await this.businessRepo.delete(businessId);
    if (business.affected == 0)
      throw new NotFoundException(`No business found with id ${businessId}`);
    return {
      done: true,
      message: `deleted successfully`,
    };
  }
  async disableWorkerPosts(workerEmail: string): Promise<void> {
    let page = 1;
    let allPages;
    const userPosts = await this.allBusiness(
      page,
      undefined,
      undefined,
      undefined,
      StatusEnum.DONE,
      undefined,
      undefined,
      workerEmail,
      false,
      'done',
    );
    const dataArray = userPosts.data;
    if (userPosts.lastPage !== 1) {
      allPages = userPosts.lastPage;
    }
    for (let i = 2; i <= allPages; i++) {
      const moreData = await this.allBusiness(
        i,
        undefined,
        undefined,
        undefined,
        StatusEnum.DONE,
        undefined,
        undefined,
        workerEmail,
        false,
        'done',
      );
      dataArray.push(moreData.data);
    }
    dataArray.forEach((post) => {
      post.admin_accept = StatusEnum.CANCELLED;
    });
    try {
      await this.businessRepo.save(dataArray);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
