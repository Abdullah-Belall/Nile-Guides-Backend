import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NotVerfiedUsersEntity } from './entities/not-verfied-users.entity';
import { Repository } from 'typeorm';
import { ClientsEntity } from './entities/client.entity';
import { OrdersEntity } from './entities/orders.entity';
import sendMessage from 'src/send-message';
import { VerfiyEmailDto } from './dto/veriy-email.dto';
import * as bcrypt from 'bcrypt';
import { UsersRoleEntity } from 'src/entities/users-role.entity';
import { CommonService } from 'src/common/common.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { WorkersService } from 'src/workers/workers.service';
import { RateBusinessDto } from './dto/rate-business.dto';
import { RatingEntity } from './entities/rate-business.entity';
import { DoneResponceInterface } from 'src/others/interfaces';
const InternalServerErrorMessage =
  'There is a problem, Please try again later.';
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(NotVerfiedUsersEntity)
    private readonly notVerfiedUsersRepo: Repository<NotVerfiedUsersEntity>,
    @InjectRepository(ClientsEntity)
    private readonly clientsRepo: Repository<ClientsEntity>,
    @InjectRepository(UsersRoleEntity)
    private readonly usersRoleRepo: Repository<UsersRoleEntity>,
    @InjectRepository(OrdersEntity)
    private readonly ordersRepo: Repository<OrdersEntity>,
    @InjectRepository(RatingEntity)
    private readonly ratingRepo: Repository<RatingEntity>,
    private readonly commonService: CommonService,
    private readonly workersService: WorkersService,
  ) {}
  async register(registerDto: RegisterDto): Promise<DoneResponceInterface> {
    const user = await this.usersRoleRepo.findOne({
      where: { email: registerDto.email },
    });
    if (user)
      throw new ConflictException(
        'Email is already in use. Please try another one.',
      );
    const notVerfiedUser = await this.findNotVerfiedUser(
      'email',
      registerDto.email,
      false,
    );
    const code = this.generateVerificationCode();
    registerDto.verification_code = code;
    registerDto.created_at = new Date();
    registerDto.password = await bcrypt.hash(registerDto.password, 10);
    try {
      const user = this.notVerfiedUsersRepo.create(registerDto);
      if (notVerfiedUser) {
        await this.notVerfiedUsersRepo.update(notVerfiedUser.id, registerDto);
      } else {
        await this.notVerfiedUsersRepo.save(user);
      }
      await sendMessage(
        registerDto.email,
        'Verification Code',
        `This verification code is valid for only 10 minutes: <strong>${code}</strong>`,
      );
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('This email is already registered.');
      }
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    return {
      done: true,
      message: 'Verification code sended to your email address.',
    };
  }
  async verfiyEmail({
    email,
    verification_code,
  }: VerfiyEmailDto): Promise<DoneResponceInterface> {
    const isRegistedUser = await this.usersRoleRepo.findOne({
      where: { email },
    });
    if (isRegistedUser)
      throw new ConflictException(`Your email is already verfied.`);
    const isNotVerfiedUser: any = await this.findNotVerfiedUser(
      'email',
      email,
      true,
    );
    if (!isNotVerfiedUser)
      throw new UnauthorizedException(
        'No users found with this email address.',
      );

    const now = new Date();
    const verificationCodeDate = isNotVerfiedUser.created_at;
    const condtion = now.getTime() - verificationCodeDate.getTime();
    if (
      isNotVerfiedUser.verification_code !== verification_code ||
      condtion > 600000
    )
      throw new UnauthorizedException(
        'Invalid verification code. Please try again.',
      );
    try {
      await this.notVerfiedUsersRepo.delete(isNotVerfiedUser.id);
      isNotVerfiedUser.client_id = isNotVerfiedUser.id;
      isNotVerfiedUser.user_id = isNotVerfiedUser.id;
      delete isNotVerfiedUser.id;
      const user = this.clientsRepo.create(isNotVerfiedUser);
      const userRole = this.usersRoleRepo.create(isNotVerfiedUser);
      await this.usersRoleRepo.save(userRole);
      await this.clientsRepo.save(user);
      await sendMessage(
        email,
        `Congratulations`,
        `Thank you for joining Nile Guides.`,
      );
    } catch (error) {
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    return {
      done: true,
      message: `You can now login with your email address to your account.`,
    };
  }
  async findNotVerfiedUser(
    by: 'id' | 'email',
    value: string,
    isNeedPass: boolean,
  ): Promise<NotVerfiedUsersEntity> {
    const client = this.notVerfiedUsersRepo.createQueryBuilder('client');
    isNeedPass ? client.addSelect('client.password') : '';
    client.andWhere(`client.${by} = :value`, { value: value });
    return await client.getOne();
  }
  async Book(
    clientEmail: string,
    businessId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<DoneResponceInterface> {
    const condition = this.checkDate(createOrderDto.day);
    if (condition)
      throw new BadRequestException(`You cannot make a book with old date.`);
    const business = await this.workersService.getBusiness(businessId, true);
    if (!business)
      throw new BadRequestException(`No business with id ${businessId}.`);
    if (business.admin_accept !== `done`)
      throw new ForbiddenException(
        `Business you trying to book is not accepted from admins yet.`,
      );
    const client = await this.checkClientRights(clientEmail);
    const orderReady = this.ordersRepo.create({
      client,
      business,
      ...createOrderDto,
    });
    try {
      await this.ordersRepo.save(orderReady);
    } catch (err) {
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    await sendMessage(
      business.worker.email,
      'Client Book Business',
      `${client.first_name} ${client.last_name} Booked a business from u go to website to more details`,
    );
    return {
      done: true,
      message: `Order maked successfully.`,
    };
  }
  async cancelBook(
    clientEmail: string,
    orderId: string,
  ): Promise<DoneResponceInterface> {
    const client = await this.checkClientRights(clientEmail);
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['business', 'client'],
    });
    if (!order)
      throw new BadRequestException(`No order found with id ${orderId}.`);
    if (client.email !== order.client.email)
      throw new ForbiddenException(
        `You don't have the right to cancel this order.`,
      );
    if (order.client_cancel)
      throw new BadRequestException(`You alreay canceled this order.`);
    const business = await this.workersService.getBusiness(
      order.business.id,
      true,
    );
    if (!business)
      throw new NotFoundException(`No business found with this info.`);
    try {
      await this.ordersRepo.update(orderId, { ...order, client_cancel: true });
    } catch (err) {
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    await sendMessage(
      business.worker.email,
      'business',
      `${order.client.first_name} ${order.client.last_name} canceled the business which he booked from u`,
    );
    return {
      done: true,
      message: `Order with id ${orderId} canceled successfully.`,
    };
  }
  async paidConfiramtion(
    clientEmail: string,
    orderId: string,
    paid: number,
  ): Promise<DoneResponceInterface> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['client'],
    });
    if (order.client.email !== clientEmail) {
      throw new ForbiddenException(
        `You don't have the right to paid order you don't own.`,
      );
    }
    if (!order) throw new BadRequestException(`No order found with this info.`);
    if (order.worker_accept !== 'done')
      throw new ForbiddenException(`The worker didn't confirm the order yet.`);
    if (order.client_cancel)
      throw new ForbiddenException('You canceled this order.');
    order.client_paid = Math.floor(paid);
    try {
      await this.ordersRepo.update(orderId, order);
    } catch (err) {
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    return {
      done: true,
      message: `You paid ${paid}.`,
    };
  }
  async rateBusiness(
    clientEmail: string,
    businessId: string,
    rateBusinessDto: RateBusinessDto,
  ): Promise<DoneResponceInterface> {
    const client = await this.commonService.findUserByEmail(
      'clients',
      clientEmail,
      false,
    );
    if (!client)
      throw new UnauthorizedException(`No client found with this info.`);
    const business = await this.workersService.getBusinessWithOrders(
      businessId,
      clientEmail,
    );
    if (!business)
      throw new BadRequestException(`No business found with this info.`);
    const clientRate = await this.ratingRepo
      .createQueryBuilder('rate')
      .leftJoin('rate.client', 'client')
      .addSelect('client.email')
      .leftJoin('rate.business', 'business')
      .addSelect('business.id')
      .andWhere('business.id = :businessId', { businessId })
      .andWhere('client.email = :clientEmail', { clientEmail })
      .getOne();
    if (clientRate)
      throw new BadRequestException(`You rated this post before.`);
    const order = business.orders[business.orders.length - 1];
    const condition = this.checkDate(order.day);
    if (
      !order ||
      (order && order.worker_accept !== 'done') ||
      (order && order.client_cancel) ||
      (order && order.client_paid == 0) ||
      !condition
    )
      throw new BadRequestException(`You can't rate business you did't try.`);
    const rate =
      (+business.rate * business.raters_counter + rateBusinessDto.rate) /
      (business.raters_counter + 1);
    const ratingReady = this.ratingRepo.create({
      business,
      client,
      rating: rateBusinessDto.rate,
      text: rateBusinessDto.text,
    });
    try {
      await this.workersService.updateBusinessRate(businessId, {
        rate,
        raters_counter: business.raters_counter + 1,
      });
      await this.ratingRepo.save(ratingReady);
    } catch (err) {
      throw new InternalServerErrorException(InternalServerErrorMessage);
    }
    return {
      done: true,
      message: `Your rate added successfully.`,
    };
  }
  async getBusinessReviews(
    businessId: string,
    page: number = 1,
    mostRated: boolean = false,
  ): Promise<any> {
    const query = this.ratingRepo
      .createQueryBuilder('item')
      .leftJoin('item.business', 'business')
      .leftJoin('item.client', 'client')
      .addSelect('client.first_name')
      .addSelect('client.last_name')
      .addSelect('client.avatar')
      .addSelect('client.gender')
      .where('business.id = :businessId', { businessId });
    if (mostRated) {
      query.orderBy('item.rating', 'DESC');
    } else {
      query.orderBy('item.created_at', 'DESC');
    }
    const [data, total] = await query
      .skip((page - 1) * 20)
      .take(20)
      .getManyAndCount();
    return {
      data,
      total,
      page: +page,
      lastPage: Math.ceil(total / 20),
    };
  }
  async getRate(clientEmail: string, businessId: string) {
    const rate = await this.ratingRepo.findOne({
      where: {
        client: { email: clientEmail },
        business: { id: businessId },
      },
    });
    if (!rate) throw new NotFoundException(`You didn't rate this post before.`);
    return {
      done: true,
      rate: rate.rating,
      text: rate.text,
    };
  }
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  private async checkClientRights(email: string): Promise<ClientsEntity> {
    const client = await this.clientsRepo.findOne({ where: { email } });
    if (!client)
      throw new UnauthorizedException(`No client found with this info.`);
    return client;
  }
  private checkDate(dateString: string): boolean {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(dateString)) {
      throw new BadRequestException('Invalid date format. Use DD-MM-YYYY.');
    }
    const [day, month, year] = dateString.split('-').map(Number);
    const userDate = new Date(year, month - 1, day);
    if (isNaN(userDate.getTime())) {
      throw new BadRequestException('Invalid date.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return userDate < today;
  }
}
