import { IsOptional, IsString } from 'class-validator';

export class TransitionCommentDto {
  @IsString()
  @IsOptional()
  comment?: string;
}
