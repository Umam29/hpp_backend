import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRawMaterialFormSwaggerDto {
  @ApiProperty({ example: 'Gula Pasir', description: 'Nama bahan baku' })
  name: string;

  @ApiProperty({ example: 'kg', description: 'Satuan (kg, liter, pcs, dll)' })
  unit: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'File gambar bahan baku (jpg, jpeg, png, gif, webp)',
  })
  image?: string;

  @ApiPropertyOptional({ example: 0, description: 'Stok awal' })
  stock?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Jumlah pembelian terakhir',
  })
  lastPurchaseQuantity?: number;

  @ApiPropertyOptional({
    example: 750000,
    description: 'Total pembelian terakhir',
  })
  lastPurchaseTotal?: number;

  @ApiPropertyOptional({ example: 10, description: 'Titik reorder minimum' })
  reorderPoint?: number;
}

export class UpdateRawMaterialFormSwaggerDto {
  @ApiPropertyOptional({ example: 'Gula Pasir', description: 'Nama bahan baku' })
  name?: string;

  @ApiPropertyOptional({ example: 'kg', description: 'Satuan' })
  unit?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'File gambar bahan baku baru (jpg, jpeg, png, gif, webp)',
  })
  image?: string;

  @ApiPropertyOptional({ example: 10, description: 'Titik reorder minimum' })
  reorderPoint?: number;
}
