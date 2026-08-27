import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [JwtModule.register({}), UsersModule, MessagesModule, ConversationsModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class GatewayModule {}
