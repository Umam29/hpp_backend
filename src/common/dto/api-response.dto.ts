import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Authorization header is required' })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
