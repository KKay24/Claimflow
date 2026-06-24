import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory } from '../../database/entities/application.entity';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(ExpenseCategory, { message: 'Invalid category' })
  @IsOptional()
  category?: ExpenseCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than zero' })
  @IsOptional()
  amount?: number;
}
