import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductPriceLogResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  productId: string;

  @ApiProperty({ example: 8500, description: 'HPP sebelum margin' })
  costPrice: number;

  @ApiProperty({ example: 11050, description: 'Harga jual setelah margin' })
  sellingPrice: number;

  @ApiProperty({
    example: 'PRODUCT_CREATED',
    enum: ['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'RAW_MATERIAL_RECALC'],
  })
  reason: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440200',
    description: 'ID referensi (mis. transactionId untuk RAW_MATERIAL_RECALC)',
  })
  referenceId?: string | null;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  createdBy?: string | null;
}

export class ProductPriceLogListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Product price logs retrieved successfully' })
  message: string;

  @ApiProperty({ type: [ProductPriceLogResponseDto] })
  data: ProductPriceLogResponseDto[];
}
