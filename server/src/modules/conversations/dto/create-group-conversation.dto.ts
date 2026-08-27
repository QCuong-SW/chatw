import { IsArray, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupConversationDto {
  @ApiProperty({ example: 'Project Alpha Team' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ type: [String], description: 'Array of user IDs to add' })
  @IsArray()
  @IsNotEmpty()
  memberIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
