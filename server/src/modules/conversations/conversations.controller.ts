import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @ApiOperation({ summary: 'Get all user conversations' })
  @Get()
  async getMyConversations(@Request() req: any) {
    return this.conversationsService.getUserConversations(req.user.userId);
  }

  @ApiOperation({ summary: 'Create or get direct conversation' })
  @Post('direct')
  async createDirect(@Body('recipientId') recipientId: string, @Request() req: any) {
    return this.conversationsService.createDirect(req.user.userId, recipientId);
  }

  @ApiOperation({ summary: 'Create group conversation' })
  @Post('group')
  async createGroup(@Body() body: { title: string; memberIds: string[] }, @Request() req: any) {
    return this.conversationsService.createGroup(req.user.userId, body.title, body.memberIds);
  }

  @ApiOperation({ summary: 'Add members to group' })
  @Post(':id/members')
  async addMembers(@Param('id') id: string, @Body('memberIds') memberIds: string[], @Request() req: any) {
    return this.conversationsService.addMembers(id, memberIds, req.user.userId);
  }

  @ApiOperation({ summary: 'Rename group' })
  @Patch(':id/rename')
  async renameGroup(@Param('id') id: string, @Body('title') title: string, @Request() req: any) {
    return this.conversationsService.renameGroup(id, title, req.user.userId);
  }

  @ApiOperation({ summary: 'Leave group' })
  @Delete(':id/leave')
  async leaveGroup(@Param('id') id: string, @Request() req: any) {
    await this.conversationsService.leaveGroup(id, req.user.userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Delete/Clear conversation for me (Xóa từ 1 phía)' })
  @Delete(':id/for-me')
  async deleteForMe(@Param('id') id: string, @Request() req: any) {
    return this.conversationsService.deleteForMe(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete conversation permanently (Only group creator for groups)' })
  @Delete(':id')
  async deleteConversation(@Param('id') id: string, @Request() req: any) {
    return this.conversationsService.deleteConversation(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Pin message in conversation' })
  @Post(':id/pin/:messageId')
  async pinMessage(@Param('id') id: string, @Param('messageId') messageId: string, @Request() req: any) {
    return this.conversationsService.pinMessage(id, messageId, req.user.userId);
  }

  @ApiOperation({ summary: 'Unpin message in conversation' })
  @Delete(':id/pin')
  async unpinMessage(@Param('id') id: string, @Request() req: any) {
    return this.conversationsService.unpinMessage(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get conversation details by ID' })
  @Get(':id')
  async getById(@Param('id') id: string, @Request() req: any) {
    return this.conversationsService.getById(id, req.user.userId);
  }
}
