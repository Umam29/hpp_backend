import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from '../generated/prisma/client';
import {
  TransactionListResponseDto,
  TransactionSingleResponseDto,
} from './dto/transaction-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserId } from '../common/decorators/user-id.decorator';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Transaction')
@ApiBearerAuth('access-token')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ambil daftar transaksi (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: TransactionListResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  async findAll(@Query() query: PaginationQueryDto): Promise<{
    success: boolean;
    message: string;
    data: Transaction[];
    meta: TransactionListResponseDto['meta'];
  }> {
    const { data, meta } = await this.transactionService.findAll(query);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data,
      meta,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Buat transaksi baru',
    description:
      'EXPENSE + RAW_MATERIAL_PURCHASE: totalAmount dihitung server dari unitPrice × quantity tiap item. INCOME + SALE: totalAmount dari input user, unitPrice tiap item diisi otomatis dari sellingPrice produk. Pembelian bahan baku otomatis recalculate costPrice & sellingPrice produk terkait.',
  })
  @ApiResponse({ status: 201, type: TransactionSingleResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto })
  async create(
    @UserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<{ success: boolean; message: string; data: Transaction }> {
    const data = await this.transactionService.createTransaction(
      createTransactionDto,
      userId,
    );

    return {
      success: true,
      message: 'Transaction created successfully',
      data,
    };
  }
}
