import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAppStore } from '../stores/appStore';

const getHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  return hostUri ? hostUri.split(':')[0] : null;
};

const expoHost = getHostFromExpo();
const defaultAndroidHost = __DEV__ ? '127.0.0.1' : '10.0.2.2';
const defaultLocalHost = Platform.OS === 'android' ? defaultAndroidHost : 'localhost';
const localhostAliases = ['localhost', '127.0.0.1', '::1'];
const resolvedExpoHost =
  expoHost && !localhostAliases.includes(expoHost) ? expoHost : null;

const normalizeBaseUrl = (rawUrl: string, fallbackPort: number, fallbackPath = '') => {
  try {
    const url = new URL(rawUrl);
    const isLocalhost = localhostAliases.includes(url.hostname);

    if (Platform.OS === 'android' && isLocalhost && !__DEV__) {
      // Android release/emulator builds cannot always reach host services through localhost.
      url.hostname = resolvedExpoHost || defaultAndroidHost;
    }

    if (!url.port) {
      url.port = String(fallbackPort);
    }

    if (fallbackPath && (!url.pathname || url.pathname === '/')) {
      url.pathname = fallbackPath;
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
};

const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_URL || (resolvedExpoHost ? `http://${resolvedExpoHost}:5000/api` : `http://${defaultLocalHost}:5000/api`),
  5000,
  '/api'
);
const AI_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_AI_API_URL || (resolvedExpoHost ? `http://${resolvedExpoHost}:5100` : `http://${defaultLocalHost}:5100`),
  5100
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiApiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const attachAuthInterceptors = (client: typeof api) => {
  client.interceptors.request.use(
    (config) => {
      const token = useAppStore.getState().token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && useAppStore.getState().token) {
        useAppStore.getState().logout();
      }
      return Promise.reject(error);
    }
  );
};

attachAuthInterceptors(api);
attachAuthInterceptors(aiApiClient);

// Auth APIs
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, fullName: string) =>
    api.post('/auth/register', { email, password, fullName }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  getMe: () => api.get('/auth/me'),
};

// Profile APIs
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data: any) => api.put('/profile', data),
  setActiveLearningScope: (data: { deckId: string; lessonDeckIds: string[] }) =>
    api.put('/profile/active-learning-scope', data),
};

// Alarm APIs
export const alarmApi = {
  getAll: () => api.get('/alarms'),
  create: (data: any) => api.post('/alarms', data),
  update: (id: string, data: any) => api.put(`/alarms/${id}`, data),
  delete: (id: string) => api.delete(`/alarms/${id}`),
};

export const deckApi = {
  getAll: (params?: any) => api.get('/decks', { params }),
};

export const topicApi = {
  getAll: (params?: any) => api.get('/topics', { params }),
};

// Learning APIs
export const learningApi = {
  getToday: (params?: any) => api.get('/learning/today', { params }),
  getReview: (params?: any) => api.get('/learning/review', { params }),
  getNew: (params?: any) => api.get('/learning/new', { params }),
  getCram: (params?: any) => api.get('/learning/cram', { params }),
  getUnfinished: () => api.get('/learning/unfinished'),
  getSession: (id: string) => api.get(`/learning/session/${id}`),
  start: (data: any) => api.post('/learning/start', data),
  updateSessionProgress: (id: string, data: any) => api.put(`/learning/session/${id}/progress`, data),
  submitFlashcard: (data: any) => api.post('/learning/flashcard-response', data),
  submitQuiz: (data: any) => api.post('/learning/quiz-response', data),
  completeSession: (data: any) => api.post('/learning/session-complete', data),
};

// Progress APIs
export const progressApi = {
  getDashboard: () => api.get('/progress/dashboard'),
  getStreak: () => api.get('/progress/streak'),
  getTrophies: () => api.get('/progress/trophies'),
};

// Word/Library APIs
export const wordApi = {
  getAll: (params?: any) => api.get('/words', { params }),
  getScopeSummary: (params?: any) => api.get('/words/summary/scope', { params }),
  getById: (id: string) => api.get(`/words/${id}`),
  favorite: (id: string) => api.post(`/words/${id}/favorite`),
};

export const aiTutorApi = {
  createConversation: (seedText?: string) => aiApiClient.post('/ai/conversations', { seedText }),
  listConversations: () => aiApiClient.get('/ai/conversations'),
  getConversation: (id: string) => aiApiClient.get(`/ai/conversations/${id}`),
  createMessage: (
    conversationId: string,
    data: {
      text?: string;
      images?: Array<{ mimeType: string; data: string; name?: string }>;
      screenContext?: any;
      learningContext?: any;
    }
  ) => aiApiClient.post(`/ai/conversations/${conversationId}/messages`, data),
  submitFeedback: (messageId: string, vote: 'up' | 'down', optionalReason?: string) =>
    aiApiClient.post(`/ai/messages/${messageId}/feedback`, { vote, optionalReason }),
};

export { AI_BASE_URL, API_BASE_URL };

export default api;
