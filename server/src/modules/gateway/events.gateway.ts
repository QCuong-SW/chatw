import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../database/redis/redis.service';
import { UsersService } from '../users/users.service';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private usersService: UsersService,
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'chatapp_secret_jwt_super_key_2026'),
      });

      socket.data.user = payload;
      const userId = payload.sub;

      await this.redisService.setUserOnline(userId, socket.id);
      socket.join(`user:${userId}`);
      this.logger.log(`👤 User ${payload.username} (${userId}) connected: ${socket.id}`);

      this.server.emit('user:online', { userId, timestamp: new Date() });
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err.message}`);
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const user = socket.data?.user;
    if (user?.sub) {
      const isCompletelyOffline = await this.redisService.setUserOffline(user.sub, socket.id);
      if (isCompletelyOffline) {
        await this.usersService.updateLastSeen(user.sub);
        this.server.emit('user:offline', { userId: user.sub, lastSeen: new Date() });
        this.logger.log(`User ${user.username} went offline`);
      }
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    socket.join(`conversation:${data.conversationId}`);
    const user = socket.data.user;
    if (user?.sub) {
      await this.messagesService.markAsRead(data.conversationId, user.sub);
      this.server.to(`conversation:${data.conversationId}`).emit('message:read_receipt', {
        conversationId: data.conversationId,
        readerId: user.sub,
      });
    }
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    socket.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string; content: string; type?: any; attachments?: any[]; replyTo?: string },
  ) {
    const user = socket.data.user;
    try {
      const savedMessage = await this.messagesService.create(user.sub, {
        conversationId: data.conversationId,
        content: data.content,
        type: data.type,
        attachments: data.attachments,
        replyTo: data.replyTo,
      });

      this.server.to(`conversation:${data.conversationId}`).emit('message:new', savedMessage);
      this.server.emit('conversation:updated', {
        conversationId: data.conversationId,
        lastMessage: savedMessage,
      });

      return savedMessage;
    } catch (err) {
      return { error: err.message };
    }
  }

  @SubscribeMessage('message:unsend')
  async handleUnsend(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const user = socket.data.user;
    try {
      await this.messagesService.unsendMessage(data.messageId, user.sub);
      this.server.to(`conversation:${data.conversationId}`).emit('message:unsent', {
        messageId: data.messageId,
        conversationId: data.conversationId,
      });
    } catch (err) {
      this.logger.error(`Unsend error: ${err.message}`);
    }
  }

  @SubscribeMessage('message:pin')
  async handlePinMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const user = socket.data.user;
    try {
      const conv = await this.conversationsService.pinMessage(data.conversationId, data.messageId, user.sub);
      this.server.to(`conversation:${data.conversationId}`).emit('message:pinned', {
        conversationId: data.conversationId,
        pinnedMessage: conv.pinnedMessage,
      });
    } catch (err) {
      this.logger.error(`Pin message error: ${err.message}`);
    }
  }

  @SubscribeMessage('message:unpin')
  async handleUnpinMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = socket.data.user;
    try {
      await this.conversationsService.unpinMessage(data.conversationId, user.sub);
      this.server.to(`conversation:${data.conversationId}`).emit('message:unpinned', {
        conversationId: data.conversationId,
      });
    } catch (err) {
      this.logger.error(`Unpin message error: ${err.message}`);
    }
  }

  @SubscribeMessage('message:react')
  async handleReaction(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string; messageId: string; emoji: string },
  ) {
    const user = socket.data.user;
    try {
      const updated = await this.messagesService.toggleReaction(data.messageId, user.sub, data.emoji);
      this.server.to(`conversation:${data.conversationId}`).emit('message:reacted', {
        messageId: data.messageId,
        conversationId: data.conversationId,
        reactions: updated.reactions,
      });
    } catch (err) {
      this.logger.error(`Failed to handle reaction: ${err.message}`);
    }
  }

  @SubscribeMessage('message:reaction')
  async handleReactionAlias(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string; messageId: string; emoji: string },
  ) {
    return this.handleReaction(socket, data);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    const user = socket.data.user;
    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: user.sub,
      username: user.username,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    const user = socket.data.user;
    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: user.sub,
    });
  }

  // WebRTC Signaling
  @SubscribeMessage('call:initiate')
  handleCallInitiate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { recipientId: string; conversationId: string; isVideo: boolean },
  ) {
    const user = socket.data.user;
    this.server.to(`user:${data.recipientId}`).emit('call:incoming', {
      fromUserId: user.sub,
      fromUsername: user.username,
      conversationId: data.conversationId,
      isVideo: data.isVideo,
    });
  }

  @SubscribeMessage('call:accept')
  handleCallAccept(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callerId: string; sdp: any },
  ) {
    const user = socket.data.user;
    this.server.to(`user:${data.callerId}`).emit('call:accepted', {
      fromUserId: user.sub,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { recipientId: string; sdp: any },
  ) {
    const user = socket.data.user;
    this.server.to(`user:${data.recipientId}`).emit('call:offer', {
      fromUserId: user.sub,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callerId: string; sdp: any },
  ) {
    const user = socket.data.user;
    this.server.to(`user:${data.callerId}`).emit('call:answer', {
      fromUserId: user.sub,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { toUserId: string; candidate: any },
  ) {
    const user = socket.data.user;
    this.server.to(`user:${data.toUserId}`).emit('call:ice-candidate', {
      fromUserId: user.sub,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('call:reject')
  handleCallReject(@ConnectedSocket() socket: Socket, @MessageBody() data: { callerId: string }) {
    const user = socket.data.user;
    this.server.to(`user:${data.callerId}`).emit('call:rejected', {
      fromUserId: user.sub,
    });
  }

  @SubscribeMessage('call:end')
  handleCallEnd(@ConnectedSocket() socket: Socket, @MessageBody() data: { otherUserId: string }) {
    const user = socket.data.user;
    this.server.to(`user:${data.otherUserId}`).emit('call:ended', {
      fromUserId: user.sub,
    });
  }
}
