import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Aukai Admin' })
  name: string;

  @ApiProperty({ example: 'aukai' })
  username: string;

  @ApiPropertyOptional({ example: '2026-06-15T08:00:00.000Z' })
  lastLoginAt?: Date | null;
}

export class UserSingleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  data: UserResponseDto;
}
