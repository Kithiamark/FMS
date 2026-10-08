import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

export const useAggregatorProfile = () => {
    return useQuery({
        queryKey: ['aggregatorProfile'],
        queryFn: async () => {
            try {
                const { data } = await axios.get('/aggregators/profiles/my-profile/');
                return data;
            } catch (err) {
                if (err.response?.status === 404) {
                    const { data } = await axios.get('/aggregators/profiles/');
                    return data?.results ? data.results[0] : (Array.isArray(data) ? data[0] : data);
                }
                throw err;
            }
        },
    });
};

export const useAggregatorConnections = () => {
    return useQuery({
        queryKey: ['aggregatorConnections'],
        queryFn: async () => {
            const { data } = await axios.get('/aggregators/connections/');
            return data?.results || (Array.isArray(data) ? data : []);
        },
    });
};

export const useMilkCollections = () => {
    return useQuery({
        queryKey: ['milkCollections'],
        queryFn: async () => {
            const { data } = await axios.get('/aggregators/collections/');
            return data?.results || (Array.isArray(data) ? data : []);
        },
    });
};

export const useLogCollectionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (collectionData) => {
            const { data } = await axios.post('/aggregators/collections/', collectionData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milkCollections'] });
        },
    });
};

export const useUpdateAggregatorProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }) => {
            const endpoint = id ? `/aggregators/profiles/${id}/` : '/aggregators/profiles/my-profile/';
            const res = await axios.patch(endpoint, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aggregatorProfile'] });
        },
    });
};

export const useConnectionMessages = (connectionId) => {
    return useQuery({
        queryKey: ['connectionMessages', connectionId],
        queryFn: async () => {
            if (!connectionId) return [];
            const { data } = await axios.get(`/aggregators/connections/${connectionId}/messages/`);
            return Array.isArray(data) ? data : (data?.results || []);
        },
        enabled: !!connectionId,
        refetchInterval: 5000,
    });
};

export const useSendMessageMutation = (connectionId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (content) => {
            const { data } = await axios.post(`/aggregators/connections/${connectionId}/messages/`, { content });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connectionMessages', connectionId] });
        },
    });
};

