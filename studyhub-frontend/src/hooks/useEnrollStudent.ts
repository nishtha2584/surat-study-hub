import { useMutation } from '@tanstack/react-query';
import { createEnrollment } from '../api/enrollment';

export function useEnrollStudent() {
    return useMutation({
        mutationFn: createEnrollment,
    });
}