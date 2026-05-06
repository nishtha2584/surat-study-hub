import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
    success: false;
    message: string;
    statusCode: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse() as
                | string
                | { message?: string | string[] };

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (Array.isArray(exceptionResponse.message)) {
                message = exceptionResponse.message.join(', ');
            } else {
                message = exceptionResponse.message ?? 'Internal server error';
            }
        } else {
            // Handle Database Errors (MySQL)
            // 1062 is ER_DUP_ENTRY
            if (exception.code === 'ER_DUP_ENTRY') {
                statusCode = HttpStatus.CONFLICT;
                message = `A record with the same unique identifier already exists.`;
                
                // Try to extract the field name from the error message if possible
                if (exception.sqlMessage) {
                    const match = exception.sqlMessage.match(/for key '(.*?)'/);
                    if (match && match[1]) {
                        const key = match[1].split('.').pop();
                         message = `Duplicate Entry detected: A record with this '${key}' already exists in our system.`;
                    }
                }
            } else if (exception.code === 'ER_ROW_IS_REFERENCED_2') {
                statusCode = HttpStatus.BAD_REQUEST;
                message = 'This record cannot be deleted because it is associated with other data.';
            } else {
                this.logger.error(`Unhandled Error: ${exception.message}`, exception.stack);
            }
        }

        const errorResponse: ErrorResponse = {
            success: false,
            message,
            statusCode,
        };

        // Transfer extra fields if it's an object
        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && !Array.isArray(exceptionResponse)) {
                Object.assign(errorResponse, exceptionResponse);
            }
        }

        response.status(statusCode).json(errorResponse);
    }
}