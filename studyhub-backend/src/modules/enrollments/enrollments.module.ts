import { Module } from '@nestjs/common';

import { EnrollmentController } from './enrollments.controller';
import { EnrollmentService } from './enrollments.service';

import { EnrollmentRepository } from './enrollments.repository';
import { EnrollmentBatchRepository } from './enrollment-batch.repository';
import { BatchesRepository } from '../batches/batches.repository';

import { DatabaseService } from 'src/common/database/database.service';
import { DatabaseModule } from 'src/common/database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [EnrollmentController],
    providers: [
        EnrollmentService,

        // Repositories
        EnrollmentRepository,
        EnrollmentBatchRepository,
        BatchesRepository,
    ],
    exports: [EnrollmentService, EnrollmentBatchRepository],

})
export class EnrollmentModule { }