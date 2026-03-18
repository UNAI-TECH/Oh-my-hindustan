import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OtpModule } from './otp/otp.module';
import { CommunitiesModule } from './communities/communities.module';
import { PostsModule } from './posts/posts.module';
import { VotesModule } from './votes/votes.module';
import { CommentsModule } from './comments/comments.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { MessagesModule } from './messages/messages.module';
import { ModerationModule } from './moderation/moderation.module';
import { MediaModule } from './media/media.module';
import { IndiaFeaturesModule } from './india-features/india-features.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    OtpModule,
    CommunitiesModule,
    PostsModule,
    VotesModule,
    CommentsModule,
    SearchModule,
    NotificationsModule,
    EventsModule,
    MessagesModule,
    ModerationModule,
    MediaModule,
    IndiaFeaturesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
