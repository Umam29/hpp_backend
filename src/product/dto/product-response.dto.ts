import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class ProductIngredientResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  productId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  rawMaterialId: string;

  @ApiProperty({ example: 0.5 })
  quantity: number;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  createdBy?: string | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  updatedBy?: string | null;
}

export class ProductResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Minuman' })
  productCategory: string;

  @ApiProperty({ example: 'Es Teh Manis' })
  name: string;

  @ApiPropertyOptional({ example: '/uploads/products/abc.jpg' })
  image?: string | null;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiPropertyOptional({ example: 30 })
  marginPercent?: number | null;

  @ApiPropertyOptional({ example: 5000 })
  fixedMargin?: number | null;

  @ApiPropertyOptional({ example: 8500, description: 'HPP sebelum margin' })
  costPrice?: number | null;

  @ApiPropertyOptional({
    example: 11050,
    description: 'Harga jual setelah margin',
  })
  sellingPrice?: number | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  createdBy?: string | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  updatedBy?: string | null;

  @ApiPropertyOptional({ type: [ProductIngredientResponseDto] })
  productIngredients?: ProductIngredientResponseDto[];
}

export class ProductSingleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Product created successfully' })
  message: string;

  @ApiProperty({ type: ProductResponseDto })
  data: ProductResponseDto;
}

export class ProductListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Products retrieved successfully' })
  message: string;

  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
