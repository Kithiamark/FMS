import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useTasks = () => {
    return useQuery({
        queryKey: ['worker-tasks'],
        queryFn: async () => {
            const { data } = await api.get('/tasks/');
            return data.results || data;
        }
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/tasks/', payload);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['worker-tasks'] })
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }) => {
            const { data } = await api.patch(`/tasks/${id}/`, payload);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['worker-tasks'] })
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => await api.delete(`/tasks/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['worker-tasks'] })
    });
};
