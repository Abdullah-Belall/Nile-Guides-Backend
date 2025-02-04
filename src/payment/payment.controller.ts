import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ClientsGuard } from '@app/clients/guards/clients.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @UseGuards(ClientsGuard)
  @Post('create-intent')
  async createPaymentIntent(
    @Body() body: { amount: number; currency: string },
  ) {
    const { amount, currency } = body;
    if (!amount || !currency) {
      throw new BadRequestException('Amount and currency are required');
    }
    return this.paymentService.createPaymentIntent(amount, currency);
  }
}
