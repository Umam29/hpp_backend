import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ProductIngredientDto } from './product-ingredient.dto';
import { parseIngredients, parseOptionalNumber } from './form-field-parsers';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  productCategory?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => parseOptionalNumber(value))
  @IsNumber()
  stock?: number;

  @IsOptional()
  @Transform(({ value }) => parseOptionalNumber(value))
  @IsNumber()
  marginPercent?: number;

  @IsOptional()
  @Transform(({ value }) => parseOptionalNumber(value))
  @IsNumber()
  fixedMargin?: number;

  @IsOptional()
  @Transform(({ value }) => parseIngredients(value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientDto)
  ingredients?: ProductIngredientDto[];
}
