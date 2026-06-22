import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RawMaterialService } from './raw-material.service';
import { InputRawMaterialDto } from './dto/input-raw-material.dto';
import { RawMaterial } from '../generated/prisma/client';
import {
  RawMaterialListResponseDto,
  RawMaterialSingleResponseDto,
} from './dto/raw-material-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserId } from '../common/decorators/user-id.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { serializeDatesToJakarta } from '../common/helpers/serialize-jakarta-datetime';

@ApiTags('Raw Material')
@ApiBearerAuth('access-token')
@Controller('raw-material')
export class RawMaterialController {
  constructor(private readonly rawMaterialService: RawMaterialService) {}

  @Post()
  @ApiOperation({ summary: 'Buat bahan baku baru' })
  @ApiResponse({ status: 201, type: RawMaterialSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  async create(
    @UserId() userId: string,
    @Body() input: InputRawMaterialDto,
  ): Promise<{ success: boolean; message: string; data: RawMaterial }> {
    const data = await this.rawMaterialService.create(input, userId);

    return {
      success: true,
      message: 'RawMaterial created successfully',
      data,
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ambil daftar bahan baku (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: RawMaterialListResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  async findAll(@Query() query: PaginationQueryDto): Promise<{
    success: boolean;
    message: string;
    data: RawMaterial[];
    meta: RawMaterialListResponseDto['meta'];
  }> {
    const { data, meta } = await this.rawMaterialService.findAll(query);

    return {
      success: true,
      message: 'RawMaterials retrieved successfully',
      data: serializeDatesToJakarta(data),
      meta,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ambil bahan baku berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID bahan baku' })
  @ApiResponse({ status: 200, type: RawMaterialSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async findOne(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; data: RawMaterial }> {
    const data = await this.rawMaterialService.findOne(id);

    return {
      success: true,
      message: 'RawMaterial retrieved successfully',
      data: serializeDatesToJakarta(data),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui bahan baku' })
  @ApiParam({ name: 'id', description: 'ID bahan baku' })
  @ApiResponse({ status: 200, type: RawMaterialSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() input: InputRawMaterialDto,
  ): Promise<{ success: boolean; message: string; data: RawMaterial }> {
    const data = await this.rawMaterialService.update(id, input, userId);

    return {
      success: true,
      message: 'RawMaterial updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus bahan baku' })
  @ApiParam({ name: 'id', description: 'ID bahan baku' })
  @ApiResponse({ status: 200, type: RawMaterialSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async remove(
    @UserId() userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; data: RawMaterial }> {
    const data = await this.rawMaterialService.remove(id, userId);

    return {
      success: true,
      message: 'RawMaterial deleted successfully',
      data,
    };
  }
}
