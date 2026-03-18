import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

type TokenRole = Role | 'GUEST';

interface TokenPayload {
  sub: string;
  email: string;
  role: TokenRole;
  tenantId: string | null;
}

@Injectable()
export class DomainAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: { email: string; password: string }) {
    const passwordHash = await bcrypt.hash(input.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          fullName: '',
          passwordHash,
        },
      });

      return this._issueTokensForUser(user);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this._issueTokensForUser(user);
  }

  guestLogin() {
    const payload: TokenPayload = {
      sub: 'guest',
      email: 'guest@motixai.dev',
      role: 'GUEST',
      tenantId: null,
    };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'change-me-access',
      expiresIn: '24h',
    });
    return {
      accessToken,
      refreshToken: null,
      user: {
        id: 'guest',
        email: 'guest@motixai.dev',
        role: 'GUEST' as const,
        tenantId: null,
        hasCompletedOnboarding: true,
        planType: 'free' as const,
        trialEndsAt: null,
        subscriptionStatus: 'none' as const,
      },
    };
  }

  async refresh(input: { refreshToken: string }) {
    try {
      const decoded = this.jwt.verify<TokenPayload>(input.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
      });

      // Look up fresh user data so subscription fields are always current
      if (decoded.sub !== 'guest') {
        const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
        if (!user) throw new UnauthorizedException('User not found');
        return this._issueTokensForUser(user);
      }

      return this.guestLogin();
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Silent success — don't reveal whether the email is registered
    if (!user) {
      return { resetToken: null, message: 'If that email exists, a reset token has been generated.' };
    }

    const resetToken = this.jwt.sign(
      { sub: user.id, purpose: 'password-reset' },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'change-me-access',
        expiresIn: '15m',
      },
    );

    // In production this would be emailed. For dev/demo we return it directly.
    return { resetToken, message: 'Use the reset token within 15 minutes.' };
  }

  async resetPassword(input: { resetToken: string; newPassword: string }) {
    let payload: { sub: string; purpose: string };

    try {
      payload = this.jwt.verify<{ sub: string; purpose: string }>(input.resetToken, {
        secret: process.env.JWT_ACCESS_SECRET || 'change-me-access',
      });
    } catch {
      throw new UnauthorizedException('Reset token is invalid or has expired');
    }

    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Reset token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _buildUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role as TokenRole,
      tenantId: user.tenantId,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      planType: user.planType,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      subscriptionStatus: user.subscriptionStatus,
    };
  }

  private _issueTokensForUser(user: User) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'change-me-access',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: this._buildUserResponse(user),
    };
  }
}
