import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ConversationDocument = Conversation & Document;

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, enum: ConversationType, default: ConversationType.DIRECT })
  type: ConversationType;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: User.name }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, default: null })
  creatorId: Types.ObjectId;

  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message', default: null })
  lastMessage: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message', default: null })
  pinnedMessage: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: User.name }], default: [] })
  hiddenFor: Types.ObjectId[];

  @Prop({ default: Date.now })
  lastMessageAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ members: 1 });
ConversationSchema.index({ hiddenFor: 1 });
ConversationSchema.index({ updatedAt: -1 });
