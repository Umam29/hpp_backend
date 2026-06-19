import { PaginationMetaDto } from '../dto/pagination-meta.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMetaDto;
}
