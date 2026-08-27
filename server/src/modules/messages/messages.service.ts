import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, MessageType } from './schemas/message.schema';
import { ConversationsService } from '../conversations/conversations.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private conversationsService: ConversationsService,
  ) {}

  async create(senderId: string, dto: SendMessageDto, isForwarded = false): Promise<MessageDocument> {
    const conversation = await this.conversationsService.getById(dto.conversationId, senderId);
    if (!conversation) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(dto.conversationId),
      senderId: new Types.ObjectId(senderId),
      type: dto.type || MessageType.TEXT,
      content: dto.content,
      attachments: dto.attachments || [],
      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : null,
      readBy: [new Types.ObjectId(senderId)],
      reactions: [],
      isDeleted: false,
      isForwarded,
    });

    await this.conversationsService.updateLastMessage(dto.conversationId, message._id.toString());

    return message.populate([
      { path: 'senderId', select: 'displayName username avatar' },
      { path: 'replyTo', populate: { path: 'senderId', select: 'displayName username' } },
    ]);
  }

  async forwardMessage(originalMessageId: string, targetConversationIds: string[], userId: string): Promise<MessageDocument[]> {
    const original = await this.messageModel.findById(originalMessageId);
    if (!original) throw new NotFoundException('Original message not found');

    const forwardedList: MessageDocument[] = [];
    for (const targetConvId of targetConversationIds) {
      const forwarded = await this.create(
        userId,
        {
          conversationId: targetConvId,
          content: original.content,
          type: original.type,
          attachments: original.attachments as any,
        },
        true,
      );
      forwardedList.push(forwarded);
    }
    return forwardedList;
  }

  async getByConversation(conversationId: string, userId: string, page = 1, limit = 50): Promise<any> {
    await this.conversationsService.getById(conversationId, userId);

    const total = await this.messageModel.countDocuments({ conversationId: new Types.ObjectId(conversationId) });
    const messages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .populate('senderId', 'displayName username avatar')
      .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'displayName username' } })
      .sort({ createdAt: 1 })
      .limit(limit * page)
      .lean();

    return {
      messages,
      total,
      page,
      hasMore: total > messages.length,
    };
  }

  async unsendMessage(messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only unsend your own messages');
    }

    message.isDeleted = true;
    message.content = 'Tin nhắn đã được thu hồi';
    message.attachments = [];
    message.reactions = [];
    await message.save();

    return message.populate('senderId', 'displayName username avatar');
  }

  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const msg = await this.messageModel.findById(messageId);
    if (!msg) throw new NotFoundException('Message not found');

    const userObjId = new Types.ObjectId(userId);
    msg.reactions = msg.reactions || [];

    const existingIdx = msg.reactions.findIndex(
      (r) => (r.userId?.toString() === userId || (r.userId as any)?._id?.toString() === userId) && r.emoji === emoji,
    );

    if (existingIdx !== -1) {
      msg.reactions.splice(existingIdx, 1);
    } else {
      msg.reactions = msg.reactions.filter(
        (r) => r.userId?.toString() !== userId && (r.userId as any)?._id?.toString() !== userId,
      );
      msg.reactions.push({ emoji, userId: userObjId } as any);
    }

    await msg.save();
    return msg.populate([
      { path: 'senderId', select: 'displayName username avatar' },
      { path: 'reactions.userId', select: 'displayName username avatar' },
    ]);
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    return this.toggleReaction(messageId, userId, emoji);
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        readBy: { $ne: new Types.ObjectId(userId) },
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) },
      },
    );
  }
}
