import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Product, ProductPriceLog, Prisma } from '../generated/prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductIngredientDto } from './dto/product-ingredient.dto';
import { deleteProductImageFile } from './config/product-upload.config';
import { ProductPricingService } from './product-pricing.service';
import { PRODUCT_PRICE_LOG_REASON } from './helpers/product-pricing.helper';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { nowJakarta } from '../common/helpers/jakarta-datetime';

@Injectable()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productPricingService: ProductPricingService,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.product.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { productIngredients: true },
      }),
      this.prismaService.product.count(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: { productIngredients: true },
    });

    if (!product) {
      throw new NotFoundException(`Product not found with id ${id}`);
    }

    return product;
  }

  async findPriceLogs(productId: string): Promise<ProductPriceLog[]> {
    await this.findOne(productId);

    return this.prismaService.productPriceLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    dto: CreateProductDto,
    userId: string,
    imagePath?: string,
  ): Promise<Product> {
    const productId = randomUUID();

    await this.prismaService.$transaction(async (tx) => {
      await this.validateIngredientRawMaterials(tx, dto.ingredients);

      const now = nowJakarta();

      await tx.product.create({
        data: {
          id: productId,
          productCategory: dto.productCategory,
          name: dto.name,
          image: imagePath,
          stock: dto.stock ?? 0,
          marginPercent: dto.marginPercent,
          fixedMargin: dto.fixedMargin,
          costPrice: 0,
          sellingPrice: 0,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
          productIngredients:
            dto.ingredients && dto.ingredients.length > 0
              ? {
                  create: dto.ingredients.map((ingredient) => ({
                    id: randomUUID(),
                    rawMaterialId: ingredient.rawMaterialId,
                    quantity: ingredient.quantity,
                    createdBy: userId,
                    updatedBy: userId,
                    createdAt: now,
                    updatedAt: now,
                  })),
                }
              : undefined,
        },
      });

      await this.productPricingService.recalculateProduct(
        tx,
        productId,
        userId,
        PRODUCT_PRICE_LOG_REASON.PRODUCT_CREATED,
      );
    });

    return this.findOne(productId);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
    imagePath?: string,
  ): Promise<Product> {
    const existing = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product not found with id ${id}`);
    }

    await this.prismaService.$transaction(async (tx) => {
      if (dto.ingredients) {
        await this.validateIngredientRawMaterials(tx, dto.ingredients);
      }

      const updateData: Prisma.ProductUncheckedUpdateInput = {
        productCategory: dto.productCategory,
        name: dto.name,
        stock: dto.stock,
        marginPercent: dto.marginPercent,
        fixedMargin: dto.fixedMargin,
        updatedBy: userId,
        updatedAt: nowJakarta(),
      };

      if (imagePath) {
        updateData.image = imagePath;
      }

      if (dto.ingredients) {
        if (dto.ingredients.length === 0) {
          updateData.productIngredients = { deleteMany: {} };
        } else {
          updateData.productIngredients = {
            deleteMany: {},
            create: dto.ingredients.map((ingredient) => ({
              id: randomUUID(),
              rawMaterialId: ingredient.rawMaterialId,
              quantity: ingredient.quantity,
              createdBy: userId,
              updatedBy: userId,
              createdAt: nowJakarta(),
              updatedAt: nowJakarta(),
            })),
          };
        }
      }

      await tx.product.update({
        where: { id },
        data: updateData,
      });

      await this.productPricingService.recalculateProduct(
        tx,
        id,
        userId,
        PRODUCT_PRICE_LOG_REASON.PRODUCT_UPDATED,
      );
    });

    if (imagePath && existing.image) {
      await deleteProductImageFile(existing.image);
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<Product> {
    const existing = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product not found with id ${id}`);
    }

    const transactionItems = await this.prismaService.transactionItem.findMany({
      where: {
        productId: id,
      },
    });

    if (transactionItems.length > 0) {
      throw new BadRequestException('Product has been sold');
    }

    return await this.prismaService.$transaction(async (tx) => {
      await tx.productPriceLog.deleteMany({ where: { productId: id } });
      await tx.productIngredient.deleteMany({ where: { productId: id } });
      const deleted = await tx.product.delete({
        where: { id },
      });
      await deleteProductImageFile(existing.image);
      return deleted;
    });
  }

  private async validateIngredientRawMaterials(
    tx: Prisma.TransactionClient,
    ingredients?: ProductIngredientDto[],
  ): Promise<void> {
    if (!ingredients?.length) {
      return;
    }

    const rawMaterialIds = ingredients.map(
      (ingredient) => ingredient.rawMaterialId,
    );
    const existingRawMaterials = await tx.rawMaterial.findMany({
      where: { id: { in: rawMaterialIds } },
      select: { id: true },
    });
    const existingIds = new Set(
      existingRawMaterials.map((rawMaterial) => rawMaterial.id),
    );

    for (const rawMaterialId of rawMaterialIds) {
      if (!existingIds.has(rawMaterialId)) {
        throw new NotFoundException(
          `RawMaterial not found with id ${rawMaterialId}`,
        );
      }
    }
  }
}
