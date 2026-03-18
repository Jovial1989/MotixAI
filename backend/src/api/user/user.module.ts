import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { UserController } from './user.controller';
import { DomainUserService } from 'src/domain/user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [DomainUserService],
})
export class UserModule {}
