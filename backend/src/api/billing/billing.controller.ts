import { BadRequestException, Body, Controller, Headers, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { AuthUser, CurrentUser } from 'src/common/current-user.decorator';
import { BillingService } from 'src/domain/billing/billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Create a Stripe Checkout session for Pro subscription.
   * Requires authentication.
   */
  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @CurrentUser() user: AuthUser,
    @Body() body: { successUrl?: string; cancelUrl?: string },
  ) {
    const successUrl = body.successUrl || 'https://www.motixi.com/dashboard?billing=success';
    const cancelUrl = body.cancelUrl || 'https://www.motixi.com/dashboard?billing=cancelled';

    return this.billingService.createCheckoutSession(
      user.sub,
      user.email,
      successUrl,
      cancelUrl,
    );
  }

  /**
   * Create a Stripe Customer Portal session for managing subscription.
   * Requires authentication.
   */
  @Post('portal-session')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(
    @CurrentUser() user: AuthUser,
    @Body() body: { returnUrl?: string },
  ) {
    const returnUrl = body.returnUrl || 'https://www.motixi.com/profile';

    return this.billingService.createPortalSession(user.sub, returnUrl);
  }

  /**
   * Stripe webhook endpoint — no auth guard, uses signature verification.
   * Requires raw body for signature validation.
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    return this.billingService.handleWebhook(rawBody, signature);
  }
}
