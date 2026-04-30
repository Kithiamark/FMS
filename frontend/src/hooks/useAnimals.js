import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useAnimals = (filters = {}) => {
  return useQuery({
    queryKey: ['animals', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/animals/?${params}`);
      return response.data;
    },
  });
};

export const useAnimal = (id) => {
  return useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      const response = await api.get(`/animals/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateAnimal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/animals/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });
};

export const useUpdateAnimal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/animals/${id}/`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal', variables.id] });
    },
  });
};

export const useDeleteAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/animals/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['animals'] });
        },
    });
}
