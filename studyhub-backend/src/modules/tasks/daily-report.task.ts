import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../../common/database/database.service';
import { RowDataPacket } from 'mysql2';

interface CountRow extends RowDataPacket { count: number; }
interface AmountRow extends RowDataPacket { collected: string | null; }
interface PendingRow extends RowDataPacket { pending: string | null; }
interface BatchCountRow extends RowDataPacket { code: string; count: number; }

@Injectable()
export class DailyReportTask {
    private readonly logger = new Logger(DailyReportTask.name);

    constructor(private readonly db: DatabaseService) {}

    @Cron('30 23 * * *')
    async handleDailyReport(): Promise<void> {
        this.logger.log('Starting execution of Daily Admission Report...');

        try {
            // 1. Total new admissions today
            const admissionRows = await this.db.query<CountRow[]>(
                `SELECT COUNT(*) as count 
                 FROM enrollments 
                 WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL`
            );
            const totalAdmissions = Number(admissionRows[0]?.count) || 0;

            // 2. Fee collected today
            const feeRows = await this.db.query<AmountRow[]>(
                `SELECT SUM(amount_paid) as collected 
                 FROM enrollments 
                 WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL`
            );
            const totalFeeCollected = Number(feeRows[0]?.collected) || 0;

            // 3. Pending fees today
            const pendingRows = await this.db.query<PendingRow[]>(
                `SELECT SUM(total_monthly_fee - COALESCE(amount_paid, 0)) as pending 
                 FROM enrollments 
                 WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL AND payment_status IN ('PENDING', 'PARTIAL')`
            );
            const totalPendingFees = Number(pendingRows[0]?.pending) || 0;

            // 4. Top enrolled batches today
            const batchRows = await this.db.query<BatchCountRow[]>(
                `SELECT b.code, COUNT(eb.batch_id) as count
                 FROM enrollment_batches eb
                 JOIN batches b ON eb.batch_id = b.id
                 JOIN enrollments e ON eb.enrollment_id = e.id
                 WHERE DATE(e.created_at) = CURDATE() AND e.deleted_at IS NULL
                 GROUP BY b.code
                 ORDER BY count DESC
                 LIMIT 3`
            );
            
            const topBatches = batchRows.map(
                (row) => `${row.code} (${row.count})`
            );

            this.logger.log('=== Daily Admission Report ===');
            this.logger.log(`Total New Admissions: ${totalAdmissions}`);
            this.logger.log(`Total Fee Collected: ₹${totalFeeCollected}`);
            this.logger.log(`Total Pending Fees: ₹${totalPendingFees}`);
            this.logger.log(`Top Enrolled Batches: ${topBatches.length > 0 ? topBatches.join(', ') : 'None'}`);
            this.logger.log('==============================');
            
        } catch (error) {
            this.logger.error('Failed to generate daily admission report');
            if (error instanceof Error) {
                this.logger.error(error.message, error.stack);
            }
        }
    }
}
