import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DomainAuthService } from 'src/domain/auth/auth.service';
import { ZodError } from 'zod';
import { forgotPasswordSchema, loginSchema, refreshSchema, resetPasswordSchema, signupSchema } from './schemas';

function parseOrBadRequest<T>(schema: { parse: (v: unknown) => T }, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new BadRequestException(err.issues.map((i) => i.message).join(', '));
    }
    throw err;
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: DomainAuthService) {}

  @Post('signup')
  signup(@Body() body: unknown) {
    return this.authService.signup(parseOrBadRequest(signupSchema, body));
  }

  @Post('login')
  login(@Body() body: unknown) {
    return this.authService.login(parseOrBadRequest(loginSchema, body));
  }

  @Post('refresh')
  refresh(@Body() body: unknown) {
    return this.authService.refresh(parseOrBadRequest(refreshSchema, body));
  }

  @Post('guest')
  guest() {
    return this.authService.guestLogin();
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: unknown) {
    const { email } = parseOrBadRequest(forgotPasswordSchema, body);
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: unknown) {
    return this.authService.resetPassword(parseOrBadRequest(resetPasswordSchema, body));
  }
}
