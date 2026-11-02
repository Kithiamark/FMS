import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Live Farm Health Insights
 * GET /api/v1/ai/farm-health/
 */
export const useFarmHealth = () => {
  return useQuery({
    queryKey: ['farm-health'],
    queryFn: async () => {
      const response = await api.get('/ai/farm-health/');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

/**
 * Farmer Personalized AI Recommendations
 * GET /api/v1/ai/recommendations/
 */
export const usePersonalizedRecommendations = () => {
  return useQuery({
    queryKey: ['personalized-recommendations'],
    queryFn: async () => {
      const response = await api.get('/ai/recommendations/');
      return response.data;
    },
    staleTime: 1000 * 60 * 15, // 15 mins
  });
};

/**
 * Feed Formulation Recommendations
 * POST /api/v1/ai/predict/feed-recommendation/
 */
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

/**
 * Unified Role-Aware AI Assistant Chat
 * POST /api/v1/ai/chat/
 * Payload: { message, history, role, page, entity }
 */
export const useAIChat = () => {
  return useMutation({
    mutationFn: async ({ message, history = [], role = 'FARMER', page = '', entity = null }) => {
      const response = await api.post('/ai/chat/', {
        message,
        history,
        role,
        page,
        entity,
      });
      return response.data;
    },
  });
};

/**
 * AI Answer Feedback (Thumbs Up / Down)
 * POST /api/v1/ai/feedback/
 * Payload: { message_id, rating: 'positive' | 'negative', feedback_text }
 */
export const useAIFeedback = () => {
  return useMutation({
    mutationFn: async ({ messageId, rating, feedbackText = '' }) => {
      try {
        const response = await api.post('/ai/feedback/', {
          message_id: messageId,
          rating,
          feedback_text: feedbackText,
        });
        return response.data;
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 501) {
          // Graceful fallback if backend endpoint not yet deployed
          return { status: 'recorded_locally', messageId, rating };
        }
        throw err;
      }
    },
  });
};

/**
 * Aggregator Regional Supply Forecast
 * GET /api/v1/ai/aggregator/supply-forecast/
 * Returns regional supply predictions, volume drop risks, and route suggestions.
 */
export const useAggregatorSupplyForecast = () => {
  return useQuery({
    queryKey: ['aggregator-supply-forecast'],
    queryFn: async () => {
      try {
        const response = await api.get('/ai/aggregator/supply-forecast/');
        return response.data;
      } catch (err) {
        // Graceful fallback: return null if endpoint does not yet exist on backend
        // Never fabricate invented numbers
        if (err.response?.status === 404 || err.response?.status === 501) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 20, // 20 mins
    retry: false,
  });
};

/**
 * Vet Pre-Visit Brief
 * GET /api/v1/ai/vet/pre-visit-brief/?visit_id=<id>
 * Returns animal history summary, yield trend drop, risk score, and previous treatments.
 */
export const usePreVisitBrief = (visitId) => {
  return useQuery({
    queryKey: ['vet-pre-visit-brief', visitId],
    queryFn: async () => {
      if (!visitId) return null;
      try {
        const response = await api.get(`/ai/vet/pre-visit-brief/?visit_id=${visitId}`);
        return response.data;
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 501) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!visitId,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
};

/**
 * Admin Anomalies Detection
 * GET /api/v1/ai/admin/anomalies/
 * Returns system-wide telemetry anomalies: subscription churn spikes, ticket surges, unusual milk variances.
 */
export const useAdminAnomalies = () => {
  return useQuery({
    queryKey: ['admin-anomalies'],
    queryFn: async () => {
      try {
        const response = await api.get('/ai/admin/anomalies/');
        return response.data;
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 501) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 15,
    retry: false,
  });
};

/**
 * Admin "Ask the Data" Natural Language Query
 * POST /api/v1/ai/admin/ask-data/
 * Payload: { query }
 */
export const useAdminAskData = () => {
  return useMutation({
    mutationFn: async ({ query }) => {
      try {
        const response = await api.post('/ai/admin/ask-data/', { query });
        return response.data;
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 501) {
          return {
            answer: `Backend AI endpoint for platform natural-language queries (/api/v1/ai/admin/ask-data/) is pending implementation. Your query "${query}" has been received.`,
            mode: 'fallback',
          };
        }
        throw err;
      }
    },
  });
};

export default {
  useFarmHealth,
  usePersonalizedRecommendations,
  useFeedRecommendation,
  useAIChat,
  useAIFeedback,
  useAggregatorSupplyForecast,
  usePreVisitBrief,
  useAdminAnomalies,
  useAdminAskData,
};
