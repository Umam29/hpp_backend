import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class InputRawMaterialDto {
  @ApiProperty({ example: 'Gula Pasir', description: 'Nama bahan baku' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'kg', description: 'Satuan (kg, liter, pcs, dll)' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 0, description: 'Stok awal' })
  @IsOptional()
  @IsNumber()
  stock?: number;

  // @ApiPropertyOptional({
  //   example: 0,
  //   description: 'Harga rata-rata per satuan',
  // })
  // @IsOptional()
  // @IsNumber()
  // averagePrice?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Jumlah pembelian terakhir',
  })
  @IsOptional()
  @IsNumber()
  lastPurchaseQuantity?: number;

  @ApiPropertyOptional({
    example: 750000,
    description: 'Total pembelian terakhir',
  })
  @IsOptional()
  @IsNumber()
  lastPurchaseTotal?: number;

  @ApiPropertyOptional({ example: 10, description: 'Titik reorder minimum' })
  @IsOptional()
  @IsNumber()
  reorderPoint?: number;
}
