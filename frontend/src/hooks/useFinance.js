import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useFinanceSummary = (year, month) => {
  return useQuery({
    queryKey: ['finance-summary', year, month],
    queryFn: async () => {
      const response = await api.get(`/income/summary/?year=${year}&month=${month}`);
      return response.data;
    },
  });
};

export const useCreateIncome = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/income/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-summary'] }),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/expenses/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-summary'] }),
  });
};
