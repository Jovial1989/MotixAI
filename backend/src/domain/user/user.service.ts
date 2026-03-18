import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

const TRIAL_DAYS = 7;

@Injectable()
export class DomainUserService {
  constructor(private readonly prisma: PrismaService) {}

  async selectPlan(userId: string, planType: 'free' | 'trial' | 'premium') {
    const data: Record<string, unknown> = { planType };

    if (planType === 'trial') {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
      data.trialEndsAt = trialEndsAt;
      data.subscriptionStatus = 'active';
    } else if (planType === 'premium') {
      data.subscriptionStatus = 'active';
    } else {
      data.subscriptionStatus = 'none';
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      planType: user.planType,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    };
  }

  async completeOnboarding(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true },
    });
    return { success: true };
  }
}
