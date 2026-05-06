import { Request } from 'express';

export type RequestWithUser = Request & {
    user: {
        userId: string;
        role: string;
    };
};