import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class RawMaterialResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Gula Pasir' })
  name: string;

  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 100 })
  stock: number;

  @ApiProperty({ example: 15000 })
  averagePrice: number;

  @ApiPropertyOptional({ example: 50 })
  lastPurchaseQuantity?: number | null;

  @ApiPropertyOptional({ example: 750000 })
  lastPurchaseTotal?: number | null;

  @ApiProperty({ example: 10 })
  reorderPoint: number;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  createdBy?: string | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  updatedBy?: string | null;
}

export class RawMaterialSingleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'RawMaterial created successfully' })
  message: string;

  @ApiProperty({ type: RawMaterialResponseDto })
  data: RawMaterialResponseDto;
}

export class RawMaterialListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'RawMaterials retrieved successfully' })
  message: string;

  @ApiProperty({ type: [RawMaterialResponseDto] })
  data: RawMaterialResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
