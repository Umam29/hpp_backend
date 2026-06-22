import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class TransactionItemDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440010',
    description: 'ID produk (wajib untuk transaksi SALE)',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440020',
    description: 'ID bahan baku (wajib untuk PURCHASE jika tidak membuat bahan baru)',
  })
  @IsOptional()
  @IsString()
  rawMaterialId?: string;

  @ApiPropertyOptional({
    example: 'Gula Pasir',
    description: 'Nama bahan baku baru (wajib jika rawMaterialId kosong pada PURCHASE)',
  })
  @IsOptional()
  @IsString()
  newRawMaterialName?: string;

  @ApiPropertyOptional({
    example: 'kg',
    description: 'Satuan bahan baku baru (wajib jika newRawMaterialName diisi)',
  })
  @IsOptional()
  @IsString()
  newRawMaterialUnit?: string;

  @ApiProperty({ example: 'Gula Pasir', description: 'Nama item' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 10, description: 'Jumlah/kuantitas' })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  quantity: number;

  @ApiProperty({
    example: 150000,
    description:
      'Subtotal item. Wajib untuk RAW_MATERIAL_PURCHASE. Untuk SALE dihitung server dari sellingPrice × quantity.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  subTotal?: number;
}
