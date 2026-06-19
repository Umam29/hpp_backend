import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { ApiErrorResponseDto } from '../common/dto/api-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Data dashboard keuangan',
    description:
      'Mengembalikan ringkasan saldo, pemasukan/pengeluaran bulanan, dan produk paling banyak ditransaksikan dalam satu response.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filter data bulanan berdasarkan tahun (opsional)',
    example: 2026,
  })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto })
  async getDashboard(@Query('year') year?: string) {
    const parsedYear = year ? Number(year) : undefined;
    const data = await this.dashboardService.getDashboard(parsedYear);

    return {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data,
    };
  }
}
