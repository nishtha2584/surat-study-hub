import { Module } from '@nestjs/common';
import { ClassSessionsService } from './class_sessions.service';
import { ClassSessionsController } from './class_sessions.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ClassSessionsRepository } from './class-sessions.repository';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService,
    ClassSessionsRepository,
  ],
  exports: [ClassSessionsService]
})
export class ClassSessionsModule { }
