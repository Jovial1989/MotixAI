import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { StepsService } from 'src/domain/steps/steps.service';

@ApiTags('steps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('steps')
export class StepsController {
  constructor(private readonly steps: StepsService) {}

  @Post(':stepId/generate-image')
  generateImage(
    @Param('stepId') stepId: string,
    @Body() body: { force?: boolean },
  ) {
    return this.steps.generateStepImage(stepId, body?.force ?? false);
  }
}
