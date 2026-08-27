import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDirectConversationDto {
  @ApiProperty({ description: 'UserId of the person to chat with' })
  @IsNotEmpty()
  @IsString()
  recipientId: string;
}
