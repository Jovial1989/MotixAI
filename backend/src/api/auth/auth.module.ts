import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { DomainAuthService } from 'src/domain/auth/auth.service';
import { JwtStrategy } from 'src/infrastructure/auth/jwt.strategy';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [AuthController],
  providers: [DomainAuthService, JwtStrategy],
  exports: [DomainAuthService],
})
export class AuthModule {}
