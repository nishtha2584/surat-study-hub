import { DatabaseService } from './database.service';
import {
    RowDataPacket,
    ResultSetHeader,
    PoolConnection,
} from 'mysql2/promise';
import { SqlParam } from '../types/sql-param.type';

export abstract class BaseRepository {
    constructor(protected readonly db: DatabaseService) { }

    protected async query<T extends RowDataPacket[]>(
        sql: string,
        params: SqlParam[] = [],
        conn?: PoolConnection,
    ): Promise<T> {
        if (conn) {
            const [rows] = await conn.execute<T>(sql, params);
            return rows;
        }

        return this.db.query<T>(sql, params); // ✅ use service
    }

    protected async execute(
        sql: string,
        params: SqlParam[] = [],
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        if (conn) {
            const [result] = await conn.execute<ResultSetHeader>(sql, params);
            return result;
        }

        return this.db.execute(sql, params); // ✅ use service
    }
}