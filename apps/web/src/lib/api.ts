import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;
          
          try {
            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken: this.refreshToken,
            });
            
            this.setTokens(data.accessToken, data.refreshToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Load tokens from storage on init (client-side only)
    if (typeof window !== 'undefined') {
      this.loadTokensFromStorage();
    }
  }

  private loadTokensFromStorage() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
      }
    } catch (e) {
      // Storage not available
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } catch (e) {
      // Storage not available
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (e) {
      // Storage not available
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Auth endpoints
  async register(email: string, password: string, language: string = 'en') {
    const { data } = await this.client.post('/auth/register', { email, password, language });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async loginAsGuest(language: string = 'en') {
    const { data } = await this.client.post('/auth/guest', { language });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async logout() {
    this.clearTokens();
  }

  // User endpoints
  async getMe() {
    const { data } = await this.client.get('/users/me');
    return data;
  }

  async updateMe(updates: { email?: string; phone?: string }) {
    const { data } = await this.client.put('/users/me', updates);
    return data;
  }

  async updateLanguage(language: string) {
    const { data } = await this.client.put('/users/me/language', { language });
    return data;
  }

  // Venue endpoints
  async getVenues() {
    const { data } = await this.client.get('/venues');
    return data;
  }

  async getVenue(id: string) {
    const { data } = await this.client.get(`/venues/${id}`);
    return data;
  }

  async getVenueBySlug(slug: string) {
    const { data } = await this.client.get(`/venues/slug/${slug}`);
    return data;
  }

  async getVenueQuests(venueId: string) {
    const { data } = await this.client.get(`/venues/${venueId}/quests`);
    return data;
  }

  // QR endpoints
  async resolveQR(code: string) {
    const { data } = await this.client.get(`/qr/resolve/${code}`);
    return data;
  }

  // Sponsor endpoints
  async getSponsors() {
    const { data } = await this.client.get('/sponsors');
    return data;
  }

  async getSponsor(id: string) {
    const { data } = await this.client.get(`/sponsors/${id}`);
    return data;
  }

  async getSponsorQuests(sponsorId: string) {
    const { data } = await this.client.get(`/sponsors/${sponsorId}/quests`);
    return data;
  }

  // Task endpoints
  async getTask(id: string) {
    const { data } = await this.client.get(`/tasks/${id}`);
    return data;
  }

  async getQuestTasks(questId: string) {
    const { data } = await this.client.get(`/tasks/quest/${questId}`);
    return data;
  }

  async getQuestProgress(questId: string) {
    const { data } = await this.client.get(`/tasks/quest/${questId}/progress`);
    return data;
  }

  async completeTask(taskId: string, validationData: Record<string, any>) {
    const { data } = await this.client.post(`/tasks/${taskId}/complete`, { validationData });
    return data;
  }

  // Reward endpoints
  async claimReward(questId: string, venueId: string) {
    const { data } = await this.client.post('/rewards/claim', { questId, venueId });
    return data;
  }

  async getMyPasses() {
    const { data } = await this.client.get('/rewards/passes');
    return data;
  }

  async getPass(id: string) {
    const { data } = await this.client.get(`/rewards/passes/${id}`);
    return data;
  }

  async verifyPass(code: string) {
    const { data } = await this.client.get(`/rewards/verify/${code}`);
    return data;
  }

  async redeemPass(id: string) {
    const { data } = await this.client.post(`/rewards/redeem/${id}`);
    return data;
  }

  async cancelPass(id: string) {
    const { data } = await this.client.post(`/rewards/cancel/${id}`);
    return data;
  }
}

export const api = new ApiClient();
export default api;
