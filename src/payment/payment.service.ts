import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(
      'sk_test_51QNlFcRrwPdPHRsEZ7UnuB32wbtVZaHa1IRFaZYuzaQRTLkS5OY5VsuEUMI9bIH1KpPjfDJqZXgv8CcnKRKBF0JF00b6HxcE6M',
      {
        apiVersion: '2024-11-20.acacia',
      },
    );
  }
  async createPaymentIntent(amount: number, currency: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100,
        currency: currency,
        payment_method_types: ['card'],
        metadata: {
          orderId: '12345',
        },
      });
      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      throw new Error(`Stripe Error: ${error.message}`);
    }
  }
}
