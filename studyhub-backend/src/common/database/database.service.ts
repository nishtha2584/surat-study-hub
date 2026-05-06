import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { SqlParam } from '../types/sql-param.type';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool!: Pool;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit(): Promise<void> {
        this.pool = createPool({
            host: this.configService.get<string>('DB_HOST'),
            port: Number(this.configService.get<string>('DB_PORT')),
            user: this.configService.get<string>('DB_USER'),
            password: this.configService.get<string>('DB_PASSWORD'),
            database: this.configService.get<string>('DB_NAME'),
            waitForConnections: true,
            connectionLimit: 10,
        });

        try {
            const conn = await this.pool.getConnection();
            try {
                await conn.query(`ALTER TABLE class_sessions ADD COLUMN teacher_status ENUM('PRESENT','ABSENT','LATE') NULL`);
                console.log('✅ Added teacher_status column');
            } catch (e) {
                // column might already exist
            } finally {
                conn.release();
            }
        } catch (e) {
            console.error(e);
        }

        console.log('✅ Database connected');
    }

    async onModuleDestroy(): Promise<void> {
        await this.pool.end();
        console.log('❌ Database disconnected');
    }

    /**
     * Execute parameterized query ✅ SELECT
     */
    async query<T extends RowDataPacket[]>(sql: string, params: SqlParam[] = []): Promise<T> {
        const [rows] = await this.pool.query<T>(sql, params);
        return rows;
    }


    // ✅ INSERT / UPDATE / DELETE
    async execute(
        sql: string,
        params: SqlParam[] = [],
    ): Promise<ResultSetHeader> {
        const [result] = await this.pool.execute<ResultSetHeader>(sql, params);
        return result;
    }

    /**
     * Get raw pool (for advanced use) rare use
     */
    getPool(): Pool {
        return this.pool;
    }

    /**
     * TRANSACTION SUPPORT
     */
    async getConnection(): Promise<PoolConnection> {
        return this.pool.getConnection();
    }

    async transaction<T>(
        callback: (conn: PoolConnection) => Promise<T>,
    ): Promise<T> {
        const conn = await this.getConnection();

        try {
            await conn.beginTransaction();

            const result = await callback(conn);

            await conn.commit();
            return result;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
}