import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useFarmHealth = () => {
    return useQuery({
        queryKey: ['farm-health'],
        queryFn: async () => {
            const response = await api.get('/ai/farm-health/');
            return response.data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour cache
    });
};

export const usePersonalizedRecommendations = () => {
    return useQuery({
        queryKey: ['personalized-recommendations'],
        queryFn: async () => {
            const response = await api.get('/ai/recommendations/');
            return response.data;
        },
        staleTime: 1000 * 60 * 15,
    });
};

export const useFeedRecommendation = (data) => {
    return useQuery({
        queryKey: ['feed-rec', data],
        queryFn: async () => {
            const response = await api.post('/ai/predict/feed-recommendation/', data);
            return response.data;
        },
        enabled: !!data,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
