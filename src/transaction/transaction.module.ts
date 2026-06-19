import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductModule } from '../product/product.module';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [PrismaModule, ProductModule],
  providers: [TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
