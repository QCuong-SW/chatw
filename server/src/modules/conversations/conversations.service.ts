import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument, ConversationType } from './schemas/conversation.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { RedisService } from '../../database/redis/redis.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private redisService: RedisService,
  ) {}

  async createDirect(userId: string, recipientId: string): Promise<ConversationDocument> {
    const userA = new Types.ObjectId(userId);
    const userB = new Types.ObjectId(recipientId);

    let existing = await this.conversationModel.findOne({
      type: ConversationType.DIRECT,
      members: { $all: [userA, userB], $size: 2 },
    });

    if (existing) {
      await this.conversationModel.findByIdAndUpdate(existing._id, {
        $pull: { hiddenFor: { $in: [userA, userB] } },
      });
      await this.redisService.del(`cache:conversations:${userId}`);
      await this.redisService.del(`cache:conversations:${recipientId}`);
      return existing.populate('members', 'displayName username avatar email phoneNumber customStatus');
    }

    const conversation = await this.conversationModel.create({
      type: ConversationType.DIRECT,
      members: [userA, userB],
      creatorId: userA,
      hiddenFor: [],
      lastMessageAt: new Date(),
    });

    const welcomeMsg = await this.messageModel.create({
      conversationId: conversation._id,
      senderId: userA,
      content: '👋 Hai bạn đã kết bạn thành công! Hãy gửi lời chào nhé.',
      type: 'TEXT',
      readBy: [userA, userB],
      isDeleted: false,
      reactions: [],
    });

    conversation.lastMessage = welcomeMsg._id as any;
    await conversation.save();

    await this.redisService.del(`cache:conversations:${userId}`);
    await this.redisService.del(`cache:conversations:${recipientId}`);

    return conversation.populate('members', 'displayName username avatar email phoneNumber customStatus');
  }

  async createGroup(creatorId: string, title: string, memberIds: string[]): Promise<ConversationDocument> {
    const creator = await this.userModel.findById(creatorId);
    if (!creator) throw new NotFoundException('Creator not found');

    const creatorFriends = (creator.friends || []).map((id) => id.toString());
    for (const mId of memberIds) {
      if (!creatorFriends.includes(mId)) {
        throw new BadRequestException('Chỉ có thể thêm những người đã kết bạn vào nhóm');
      }
    }

    const allMembers = Array.from(new Set([creatorId, ...memberIds])).map((id) => new Types.ObjectId(id));

    const conversation = await this.conversationModel.create({
      type: ConversationType.GROUP,
      title,
      members: allMembers,
      creatorId: new Types.ObjectId(creatorId),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(title)}`,
    });

    for (const m of allMembers) {
      await this.redisService.del(`cache:conversations:${m.toString()}`);
    }

    return conversation.populate('members', 'displayName username avatar email phoneNumber customStatus');
  }

  async getUserConversations(userId: string): Promise<ConversationDocument[]> {
    const userObjId = new Types.ObjectId(userId);

    // AUTO-CREATE OR RESTORE DIRECT CONVERSATION FOR EVERY FRIEND
    const currentUser = await this.userModel.findById(userId).lean();
    const friendIds = (currentUser?.friends || []).map((f: any) => new Types.ObjectId(f));

    if (friendIds.length > 0) {
      for (const friendObjId of friendIds) {
        let directConv = await this.conversationModel.findOne({
          type: ConversationType.DIRECT,
          members: { $all: [userObjId, friendObjId], $size: 2 },
        });

        if (!directConv) {
          await this.conversationModel.create({
            type: ConversationType.DIRECT,
            members: [userObjId, friendObjId],
            creatorId: userObjId,
            hiddenFor: [],
            lastMessageAt: new Date(),
          });
        } else if (directConv.hiddenFor && directConv.hiddenFor.some((h) => h.toString() === userId)) {
          // Unhide direct conversation because they are friends
          directConv.hiddenFor = directConv.hiddenFor.filter((h) => h.toString() !== userId);
          await directConv.save();
        }
      }
    }

    const conversations = await this.conversationModel
      .find({
        $or: [
          // Direct chats between friends are ALWAYS preserved in sidebar
          {
            type: ConversationType.DIRECT,
            members: userObjId,
          },
          // Group chats not hidden
          {
            type: ConversationType.GROUP,
            members: userObjId,
            hiddenFor: { $ne: userObjId },
          },
        ],
      })
      .populate('members', 'displayName username avatar email phoneNumber customStatus')
      .populate('lastMessage')
      .populate({
        path: 'pinnedMessage',
        populate: { path: 'senderId', select: 'displayName username avatar' },
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    return conversations as any;
  }

  async getById(conversationId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('members', 'displayName username avatar email phoneNumber customStatus')
      .populate('lastMessage')
      .populate({
        path: 'pinnedMessage',
        populate: { path: 'senderId', select: 'displayName username avatar' },
      });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isMember = (conversation.members || []).some((m: any) => {
      const mid = m?._id ? m._id.toString() : m?.toString();
      return mid === userId?.toString();
    });
    if (!isMember) throw new ForbiddenException('Not a member of this conversation');

    return conversation;
  }

  async updateLastMessage(conversationId: string, messageId: string): Promise<void> {
    const conv = await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: new Types.ObjectId(messageId),
      lastMessageAt: new Date(),
      $set: { hiddenFor: [] }, // Unhide for all on new message
    });
    if (conv) {
      for (const m of conv.members) {
        await this.redisService.del(`cache:conversations:${m.toString()}`);
      }
    }
  }

  async pinMessage(conversationId: string, messageId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.getById(conversationId, userId);
    conversation.pinnedMessage = new Types.ObjectId(messageId) as any;
    await conversation.save();

    for (const m of conversation.members) {
      await this.redisService.del(`cache:conversations:${m._id?.toString() || m.toString()}`);
    }

    return this.getById(conversationId, userId);
  }

  async unpinMessage(conversationId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.getById(conversationId, userId);
    conversation.pinnedMessage = null as any;
    await conversation.save();

    for (const m of conversation.members) {
      await this.redisService.del(`cache:conversations:${m._id?.toString() || m.toString()}`);
    }

    return this.getById(conversationId, userId);
  }

  async deleteForMe(conversationId: string, userId: string): Promise<{ success: boolean }> {
    const userObjId = new Types.ObjectId(userId);
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');

    if (conv.type === ConversationType.DIRECT) {
      // Direct chat: Clear messages history, but ALWAYS KEEP conversation item in sidebar
      conv.lastMessage = null as any;
      conv.pinnedMessage = null as any;
      await conv.save();
      await this.messageModel.deleteMany({ conversationId: new Types.ObjectId(conversationId) });
    } else {
      // Group chat: Hide from user
      await this.conversationModel.findByIdAndUpdate(conversationId, {
        $addToSet: { hiddenFor: userObjId },
      });
    }

    await this.redisService.del(`cache:conversations:${userId}`);
    return { success: true };
  }

  async deleteConversation(conversationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');

    if (conv.type === ConversationType.GROUP) {
      const isCreator = conv.creatorId && conv.creatorId.toString() === userId;
      const isFirstMember = conv.members && conv.members[0] && conv.members[0].toString() === userId;
      if (!isCreator && !isFirstMember) {
        throw new ForbiddenException('Chỉ trưởng nhóm (người tạo) mới có quyền xóa nhóm chat này');
      }

      await this.conversationModel.findByIdAndDelete(conversationId);
      await this.messageModel.deleteMany({ conversationId: new Types.ObjectId(conversationId) });
    } else {
      // Direct chat: Clear all messages on both sides, but ALWAYS KEEP conversation item in sidebar
      await this.messageModel.deleteMany({ conversationId: new Types.ObjectId(conversationId) });
      conv.lastMessage = null as any;
      conv.pinnedMessage = null as any;
      conv.hiddenFor = [];
      await conv.save();
    }

    for (const m of conv.members || []) {
      await this.redisService.del(`cache:conversations:${m.toString()}`);
    }

    return { success: true, message: 'Conversation history cleared successfully' };
  }

  async addMembers(conversationId: string, memberIds: string[], currentUserId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.type !== ConversationType.GROUP) {
      throw new BadRequestException('Cannot add members to a direct chat');
    }

    const currentUser = await this.userModel.findById(currentUserId);
    const userFriends = (currentUser?.friends || []).map((f) => f.toString());

    for (const mId of memberIds) {
      if (!userFriends.includes(mId)) {
        throw new BadRequestException('Chỉ có thể thêm những người đã kết bạn vào nhóm');
      }
    }

    const newObjIds = memberIds.map((id) => new Types.ObjectId(id));
    conversation.members = Array.from(new Set([...conversation.members, ...newObjIds]));
    await conversation.save();

    for (const m of conversation.members) {
      await this.redisService.del(`cache:conversations:${m.toString()}`);
    }

    return conversation.populate('members', 'displayName username avatar email phoneNumber customStatus');
  }

  async removeMember(conversationId: string, currentUserId: string, targetUserId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (currentUserId !== targetUserId) {
      const isCreator = conversation.creatorId && conversation.creatorId.toString() === currentUserId;
      if (!isCreator) throw new ForbiddenException('Only group creator can remove members');
    }

    conversation.members = conversation.members.filter((m) => m.toString() !== targetUserId);
    await conversation.save();

    await this.redisService.del(`cache:conversations:${targetUserId}`);
    await this.redisService.del(`cache:conversations:${currentUserId}`);

    return conversation.populate('members', 'displayName username avatar email phoneNumber customStatus');
  }

  async leaveGroup(conversationId: string, userId: string): Promise<ConversationDocument> {
    return this.removeMember(conversationId, userId, userId);
  }

  async renameGroup(conversationId: string, userId: string, title: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.type !== ConversationType.GROUP) {
      throw new BadRequestException('Can only rename group conversations');
    }

    conversation.title = title;
    await conversation.save();

    for (const m of conversation.members) {
      await this.redisService.del(`cache:conversations:${m.toString()}`);
    }

    return conversation.populate('members', 'displayName username avatar email phoneNumber customStatus');
  }
}
