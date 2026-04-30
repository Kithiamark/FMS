import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useMilkRecords = (filters = {}) => {
  return useQuery({
    queryKey: ['milk-records', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/milk/?${params}`);
      return response.data;
    },
  });
};

export const useDailyMilkSummary = (date) => {
  return useQuery({
    queryKey: ['milk-daily', date],
    queryFn: async () => {
      const response = await api.get(`/milk/summary/daily/?date=${date}`);
      return response.data;
    },
    enabled: !!date,
  });
};

export const useMilkProductionStats = (year, month) => {
    return useQuery({
        queryKey: ['milk-stats', year, month],
        queryFn: async () => {
            const response = await api.get(`/milk/summary/monthly/?year=${year}&month=${month}`);
            return response.data;
        }
    });
};

export const useCreateMilkRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/milk/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-records'] });
      queryClient.invalidateQueries({ queryKey: ['milk-daily'] });
    },
  });
};

export const useBulkCreateMilkRecords = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (records) => {
            const response = await api.post('/milk/bulk/', { records });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milk-records'] });
            queryClient.invalidateQueries({ queryKey: ['milk-daily'] });
        }
    });
};

export const useUpdateMilkRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/milk/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-records'] });
      queryClient.invalidateQueries({ queryKey: ['milk-daily'] });
    },
  });
};
