import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    this.stripe = new Stripe(secretKey);
  }

  /**
   * Create a Stripe Checkout session for Pro subscription.
   */
  async createCheckoutSession(userId: string, email: string, successUrl: string, cancelUrl: string, trial = false) {
    // Find or create Stripe customer
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get price ID from env — create a product+price in Stripe Dashboard
    const priceId = this.config.getOrThrow<string>('STRIPE_PRO_PRICE_ID');

    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      metadata: { userId },
    };

    // 7-day free trial: card collected now, first charge after trial ends
    if (trial) {
      subscriptionData.trial_period_days = 7;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, trial: trial ? 'true' : 'false' },
      subscription_data: subscriptionData,
    });

    return { sessionId: session.id, url: session.url };
  }

  /**
   * Create a Stripe Customer Portal session for managing subscription.
   */
  async createPortalSession(userId: string, returnUrl: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.stripeCustomerId) {
      throw new Error('No Stripe customer found for this user');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Construct and handle incoming Stripe webhook events.
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw err;
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.warn('checkout.session.completed missing userId in metadata');
      return;
    }

    const subscriptionId = session.subscription as string | null;
    const isTrial = session.metadata?.trial === 'true';

    if (isTrial) {
      // Trial checkout: set as trial with 7-day expiry
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          planType: 'trial',
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: session.customer as string,
          trialEndsAt,
        },
      });
      this.logger.log(`User ${userId} started Pro trial via Stripe checkout`);
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          planType: 'premium',
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: session.customer as string,
        },
      });
      this.logger.log(`User ${userId} upgraded to Pro via checkout`);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const status = subscription.status;
    const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
    const currentPeriodEnd = new Date(periodEnd * 1000);

    if (status === 'trialing') {
      // Stripe confirms trialing state — compute trial end from Stripe data
      const trialEnd = (subscription as unknown as { trial_end: number | null }).trial_end;
      const trialEndsAt = trialEnd ? new Date(trialEnd * 1000) : null;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          planType: 'trial',
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd,
          ...(trialEndsAt ? { trialEndsAt } : {}),
        },
      });
    } else if (status === 'active') {
      // Trial ended → now actively paying, upgrade to premium
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          planType: 'premium',
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd,
          trialEndsAt: null,
        },
      });
    } else if (status === 'past_due' || status === 'unpaid') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'expired' },
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'free',
        subscriptionStatus: 'none',
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
      },
    });

    this.logger.log(`User ${userId} subscription cancelled — downgraded to Free`);
  }
}
