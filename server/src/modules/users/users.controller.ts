import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @Patch('me')
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @ApiOperation({ summary: 'Search users by phone, email, username or displayName' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @Get('search')
  async searchUsers(@Query('q') query: string, @Request() req: any) {
    return this.usersService.searchUsers(query, req.user.userId);
  }

  @ApiOperation({ summary: 'Get list of pending friend requests' })
  @Get('friend-requests')
  async getFriendRequests(@Request() req: any) {
    return this.usersService.getFriendRequests(req.user.userId);
  }

  @ApiOperation({ summary: 'Get list of friends' })
  @Get('friends')
  async getFriendsList(@Request() req: any) {
    return this.usersService.getFriendsList(req.user.userId);
  }

  @ApiOperation({ summary: 'Send friend request' })
  @Post('friend-request/:targetUserId')
  async sendFriendRequest(@Param('targetUserId') targetUserId: string, @Request() req: any) {
    return this.usersService.sendFriendRequest(req.user.userId, targetUserId);
  }

  @ApiOperation({ summary: 'Accept friend request' })
  @Post('friend-request/:fromUserId/accept')
  async acceptFriendRequest(@Param('fromUserId') fromUserId: string, @Request() req: any) {
    return this.usersService.acceptFriendRequest(req.user.userId, fromUserId);
  }

  @ApiOperation({ summary: 'Reject friend request' })
  @Delete('friend-request/:fromUserId')
  async rejectFriendRequest(@Param('fromUserId') fromUserId: string, @Request() req: any) {
    return this.usersService.rejectFriendRequest(req.user.userId, fromUserId);
  }

  @ApiOperation({ summary: 'Block user' })
  @Post('block/:userId')
  async blockUser(@Param('userId') userId: string, @Request() req: any) {
    await this.usersService.blockUser(req.user.userId, userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Unblock user' })
  @Delete('block/:userId')
  async unblockUser(@Param('userId') userId: string, @Request() req: any) {
    await this.usersService.unblockUser(req.user.userId, userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Get all users' })
  @Get()
  async getAllUsers(@Request() req: any) {
    return this.usersService.findAll(req.user.userId);
  }
}
