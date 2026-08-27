import { IsNotEmpty, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../schemas/message.schema';

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({ example: 'Hello bro!' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  attachments?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  replyTo?: string;
}
