import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory } from '../../database/entities/application.entity';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsEnum(ExpenseCategory, { message: 'Invalid category' })
  @IsNotEmpty({ message: 'Category is required' })
  category: ExpenseCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than zero' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @IsString()
  @Length(3, 3, { message: 'Currency must be a 3-letter code' })
  @IsOptional()
  currency?: string;

  @IsDateString({}, { message: 'Expense date must be a valid date' })
  @IsOptional()
  expenseDate?: string;
}
