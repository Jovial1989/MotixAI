import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [PrismaModule],
  controllers: [VehiclesController],
})
export class VehiclesModule {}
