import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductPricingService } from './product-pricing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductController } from './product.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProductService, ProductPricingService],
  controllers: [ProductController],
  exports: [ProductPricingService],
})
export class ProductModule {}
