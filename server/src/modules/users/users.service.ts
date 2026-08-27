import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Conversation, ConversationDocument, ConversationType } from '../conversations/schemas/conversation.schema';
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { RedisService } from '../../database/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private redisService: RedisService,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.toLowerCase() });
  }

  async findByEmailOrUsername(identifier: string): Promise<UserDocument | null> {
    const clean = identifier.trim().toLowerCase();
    return this.userModel.findOne({
      $or: [{ email: clean }, { username: clean }, { phoneNumber: identifier.trim() }],
    });
  }

  async create(data: any): Promise<UserDocument> {
    return this.userModel.create({
      ...data,
      email: data.email?.toLowerCase(),
      username: data.username?.toLowerCase(),
    });
  }

  async update(id: string, data: any): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }

  async updateProfile(id: string, data: any): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastSeen: new Date() });
  }

  async blockUser(userId: string, targetId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: new Types.ObjectId(targetId) },
    });
  }

  async unblockUser(userId: string, targetId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: new Types.ObjectId(targetId) },
    });
  }

  async findAll(currentUserId: string): Promise<any[]> {
    return this.userModel
      .find({ _id: { $ne: new Types.ObjectId(currentUserId) } })
      .select('displayName username email phoneNumber avatar bio customStatus')
      .lean();
  }

  async searchUsers(query: string, currentUserId: string): Promise<any[]> {
    if (!query || !query.trim()) return [];

    const q = query.trim().toLowerCase();
    const currentUser = await this.userModel.findById(currentUserId);
    const userFriends = (currentUser?.friends || []).map((id) => id.toString());

    const users = await this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(currentUserId) },
        $or: [
          { phoneNumber: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } },
        ],
      })
      .select('displayName username email phoneNumber avatar bio customStatus friendRequests friends')
      .limit(20)
      .lean();

    return users.map((u: any) => {
      const uId = u._id.toString();
      const isFriend = userFriends.includes(uId);
      const hasReceivedRequest = (u.friendRequests || []).some(
        (r: any) => r.from.toString() === currentUserId && r.status === 'PENDING',
      );
      const hasSentRequest = (currentUser?.friendRequests || []).some(
        (r: any) => r.from.toString() === uId && r.status === 'PENDING',
      );

      return {
        _id: u._id,
        displayName: u.displayName,
        username: u.username,
        email: u.email,
        phoneNumber: u.phoneNumber,
        avatar: u.avatar,
        bio: u.bio,
        customStatus: u.customStatus,
        isFriend,
        hasReceivedRequest,
        hasSentRequest,
      };
    });
  }

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean; message: string }> {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const targetUser = await this.userModel.findById(toUserId);
    if (!targetUser) throw new NotFoundException('Target user not found');

    const fromUser = await this.userModel.findById(fromUserId);
    if (fromUser?.friends.some((f) => f.toString() === toUserId)) {
      throw new BadRequestException('You are already friends');
    }

    const alreadySent = targetUser.friendRequests.some(
      (r) => r.from.toString() === fromUserId && r.status === 'PENDING',
    );
    if (alreadySent) {
      throw new BadRequestException('Friend request already sent');
    }

    await this.userModel.findByIdAndUpdate(toUserId, {
      $push: { friendRequests: { from: new Types.ObjectId(fromUserId), status: 'PENDING', createdAt: new Date() } },
    });

    return { success: true, message: 'Friend request sent successfully' };
  }

  async acceptFriendRequest(currentUserId: string, fromUserId: string): Promise<{ success: boolean; message: string; conversationId?: string }> {
    const user = await this.userModel.findById(currentUserId);
    if (!user) throw new NotFoundException('User not found');

    const requestIndex = user.friendRequests.findIndex(
      (r) => r.from.toString() === fromUserId && r.status === 'PENDING',
    );

    if (requestIndex === -1) {
      throw new BadRequestException('No pending friend request found');
    }

    // Update request status
    user.friendRequests[requestIndex].status = 'ACCEPTED';
    await user.save();

    // Add to friends lists mutually
    await this.userModel.findByIdAndUpdate(currentUserId, {
      $addToSet: { friends: new Types.ObjectId(fromUserId) },
      $pull: { friendRequests: { from: new Types.ObjectId(fromUserId) } },
    });

    await this.userModel.findByIdAndUpdate(fromUserId, {
      $addToSet: { friends: new Types.ObjectId(currentUserId) },
    });

    // AUTO-CREATE DIRECT CONVERSATION WITH WELCOME GREETING
    const userA = new Types.ObjectId(currentUserId);
    const userB = new Types.ObjectId(fromUserId);

    let conv = await this.conversationModel.findOne({
      type: ConversationType.DIRECT,
      members: { $all: [userA, userB], $size: 2 },
    });

    if (!conv) {
      conv = await this.conversationModel.create({
        type: ConversationType.DIRECT,
        members: [userA, userB],
        creatorId: userA,
        hiddenFor: [],
        lastMessageAt: new Date(),
      });

      // Create welcome message
      const welcomeMsg = await this.messageModel.create({
        conversationId: conv._id,
        senderId: userA,
        content: '👋 Hai bạn đã kết bạn thành công! Hãy gửi lời chào nhé.',
        type: 'TEXT',
        readBy: [userA, userB],
        isDeleted: false,
        reactions: [],
      });

      conv.lastMessage = welcomeMsg._id as any;
      await conv.save();
    } else {
      // Unhide if was hidden
      await this.conversationModel.findByIdAndUpdate(conv._id, {
        $pull: { hiddenFor: { $in: [userA, userB] } },
      });
    }

    await this.redisService.del(`cache:conversations:${currentUserId}`);
    await this.redisService.del(`cache:conversations:${fromUserId}`);

    return { success: true, message: 'Friend request accepted', conversationId: conv._id.toString() };
  }

  async rejectFriendRequest(currentUserId: string, fromUserId: string): Promise<{ success: boolean }> {
    await this.userModel.findByIdAndUpdate(currentUserId, {
      $pull: { friendRequests: { from: new Types.ObjectId(fromUserId) } },
    });
    return { success: true };
  }

  async getFriendRequests(userId: string): Promise<any[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('friendRequests.from', 'displayName username avatar email phoneNumber customStatus')
      .lean();

    return (user?.friendRequests || [])
      .filter((r: any) => r.status === 'PENDING' && r.from)
      .map((r: any) => ({
        ...r.from,
        requestId: r._id,
        createdAt: r.createdAt,
      }));
  }

  async getFriendsList(userId: string): Promise<any[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('friends', 'displayName username avatar email phoneNumber customStatus bio')
      .lean();

    return (user?.friends || []).map((f: any) => ({
      _id: f._id,
      displayName: f.displayName,
      username: f.username,
      email: f.email,
      phoneNumber: f.phoneNumber,
      avatar: f.avatar,
      customStatus: f.customStatus,
      bio: f.bio,
    }));
  }
}
