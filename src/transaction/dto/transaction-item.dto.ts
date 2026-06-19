import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

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
    description: 'ID bahan baku (wajib untuk transaksi RAW_MATERIAL_PURCHASE)',
  })
  @IsOptional()
  @IsString()
  rawMaterialId?: string;

  @ApiProperty({ example: 'Gula Pasir', description: 'Nama item' })
  @IsString()
  itemName: string;

  @ApiProperty({ example: 10, description: 'Jumlah/kuantitas' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    example: 15000,
    description:
      'Harga per satuan. Wajib untuk RAW_MATERIAL_PURCHASE. Untuk SALE diabaikan — diambil otomatis dari sellingPrice produk.',
  })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}
