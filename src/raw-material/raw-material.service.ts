import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RawMaterial } from '../generated/prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { nowJakarta } from '../common/helpers/jakarta-datetime';
import { InputRawMaterialDto } from './dto/input-raw-material.dto';

@Injectable()
export class RawMaterialService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<RawMaterial>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.rawMaterial.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prismaService.rawMaterial.count(),
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

  async findOne(id: string): Promise<RawMaterial> {
    const rawMaterial = await this.prismaService.rawMaterial.findUnique({
      where: { id },
    });

    if (!rawMaterial) {
      throw new NotFoundException(`RawMaterial not found with id ${id}`);
    }

    return rawMaterial;
  }

  async create(dto: InputRawMaterialDto, userId: string): Promise<RawMaterial> {
    const stock = dto.stock ?? 0;

    return this.prismaService.$transaction(async (tx) => {
      const rawMaterialId = randomUUID();
      const now = nowJakarta();
      const averagePrice =
        dto.lastPurchaseTotal && dto.lastPurchaseQuantity
          ? dto.lastPurchaseTotal / dto.lastPurchaseQuantity
          : 0;

      const rawMaterial = await tx.rawMaterial.create({
        data: {
          id: rawMaterialId,
          name: dto.name,
          unit: dto.unit,
          stock,
          averagePrice,
          lastPurchaseQuantity: dto.lastPurchaseQuantity,
          lastPurchaseTotal: dto.lastPurchaseTotal,
          reorderPoint: dto.reorderPoint ?? 0,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
        },
      });

      if (stock > 0) {
        await tx.inventoryLog.create({
          data: {
            id: randomUUID(),
            rawMaterialId,
            type: 'IN_INITIAL',
            quantity: stock,
            price: averagePrice,
            referenceId: rawMaterialId,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      return rawMaterial;
    });
  }

  async update(
    id: string,
    dto: InputRawMaterialDto,
    userId: string,
  ): Promise<RawMaterial> {
    const existing = await this.findOne(id);

    const averagePrice =
      dto.lastPurchaseTotal && dto.lastPurchaseQuantity
        ? dto.lastPurchaseTotal / dto.lastPurchaseQuantity
        : existing.averagePrice;

    return this.prismaService.rawMaterial.update({
      where: { id },
      data: {
        name: dto.name,
        unit: dto.unit,
        stock: dto.stock,
        averagePrice,
        lastPurchaseQuantity: dto.lastPurchaseQuantity,
        lastPurchaseTotal: dto.lastPurchaseTotal,
        reorderPoint: dto.reorderPoint,
        updatedBy: userId,
        updatedAt: nowJakarta(),
      },
    });
  }

  async remove(id: string, userId: string): Promise<RawMaterial> {
    await this.findOne(id);

    const inventoryLogs = await this.prismaService.inventoryLog.findMany({
      where: {
        rawMaterialId: id,
      },
    });

    if (inventoryLogs.length > 0) {
      throw new BadRequestException('Raw material has inventory logs');
    }

    const ingredients = await this.prismaService.productIngredient.findMany({
      where: {
        rawMaterialId: id,
      },
    });

    if (ingredients.length > 0) {
      throw new BadRequestException('Raw material is used in products');
    }

    return this.prismaService.rawMaterial.delete({
      where: { id },
    });
  }
}
