import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Send a message' })
  @Post()
  async send(@Body() dto: SendMessageDto, @Request() req: any) {
    return this.messagesService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Forward a message to conversations' })
  @Post(':id/forward')
  async forwardMessage(
    @Param('id') id: string,
    @Body() body: { targetConversationIds: string[] },
    @Request() req: any,
  ) {
    return this.messagesService.forwardMessage(id, body.targetConversationIds, req.user.userId);
  }

  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @Get(':conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: any,
  ) {
    return this.messagesService.getByConversation(conversationId, req.user.userId, Number(page) || 1, Number(limit) || 50);
  }

  @ApiOperation({ summary: 'Unsend/Delete a message' })
  @Delete(':id')
  async unsendMessage(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.unsendMessage(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @Post(':conversationId/read')
  async markRead(@Param('conversationId') conversationId: string, @Request() req: any) {
    await this.messagesService.markAsRead(conversationId, req.user.userId);
    return { success: true };
  }
}
