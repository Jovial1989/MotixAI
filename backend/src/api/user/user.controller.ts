import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { AuthUser, CurrentUser } from 'src/common/current-user.decorator';
import { DomainUserService } from 'src/domain/user/user.service';
import { z, ZodError } from 'zod';

const selectPlanSchema = z.object({
  planType: z.enum(['free', 'trial', 'premium']),
});

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

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: DomainUserService) {}

  @Post('select-plan')
  selectPlan(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { planType } = parseOrBadRequest(selectPlanSchema, body);
    return this.userService.selectPlan(user.sub, planType);
  }

  @Post('onboarding-complete')
  completeOnboarding(@CurrentUser() user: AuthUser) {
    return this.userService.completeOnboarding(user.sub);
  }
}
