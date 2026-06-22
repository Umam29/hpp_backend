import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class InputRawMaterialDto {
  @ApiProperty({ example: 'Gula Pasir', description: 'Nama bahan baku' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'kg', description: 'Satuan (kg, liter, pcs, dll)' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 0, description: 'Stok awal' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  stock?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Jumlah pembelian terakhir',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  lastPurchaseQuantity?: number;

  @ApiPropertyOptional({
    example: 750000,
    description: 'Total pembelian terakhir',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  lastPurchaseTotal?: number;

  @ApiPropertyOptional({ example: 10, description: 'Titik reorder minimum' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  reorderPoint?: number;
}
