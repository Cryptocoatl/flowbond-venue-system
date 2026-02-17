import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';

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

  // Generic HTTP methods
  async get<T>(url: string): Promise<T> {
    const { data } = await this.client.get<T>(url);
    return data;
  }

  async post<T>(url: string, body?: any): Promise<T> {
    const { data } = await this.client.post<T>(url, body);
    return data;
  }

  async put<T>(url: string, body?: any): Promise<T> {
    const { data } = await this.client.put<T>(url, body);
    return data;
  }

  async delete<T>(url: string): Promise<T> {
    const { data } = await this.client.delete<T>(url);
    return data;
  }

  async patch<T>(url: string, body?: any): Promise<T> {
    const { data } = await this.client.patch<T>(url, body);
    return data;
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

  // ==========================================
  // Registration endpoints
  // ==========================================

  async registerVenue(venueData: {
    name: string;
    slug: string;
    description?: string;
    address?: string;
    city?: string;
    timezone?: string;
  }) {
    const { data } = await this.client.post('/registration/venue', venueData);
    return data;
  }

  async registerEvent(eventData: {
    name: string;
    slug: string;
    description?: string;
    startDate: string;
    endDate: string;
    timezone?: string;
  }) {
    const { data } = await this.client.post('/registration/event', eventData);
    return data;
  }

  async registerBrand(brandData: {
    name: string;
    slug: string;
    description?: string;
    website?: string;
  }) {
    const { data } = await this.client.post('/registration/brand', brandData);
    return data;
  }

  async getMyRegistrations() {
    const { data } = await this.client.get('/registration/my');
    return data;
  }

  async getRegistration(id: string) {
    const { data } = await this.client.get(`/registration/${id}`);
    return data;
  }

  // ==========================================
  // Admin endpoints
  // ==========================================

  async getPendingRegistrations() {
    const { data } = await this.client.get('/admin/registrations');
    return data;
  }

  async approveRegistration(id: string, reviewNotes?: string) {
    const { data } = await this.client.post(`/admin/registrations/${id}/approve`, {
      status: 'APPROVED',
      reviewNotes,
    });
    return data;
  }

  async rejectRegistration(id: string, reviewNotes?: string) {
    const { data } = await this.client.post(`/admin/registrations/${id}/reject`, {
      status: 'REJECTED',
      reviewNotes,
    });
    return data;
  }

  // ==========================================
  // Management endpoints
  // ==========================================

  async getMyVenues() {
    const { data } = await this.client.get('/manage/venues');
    return data;
  }

  async getMyEvents() {
    const { data } = await this.client.get('/manage/events');
    return data;
  }

  async getMyBrands() {
    const { data } = await this.client.get('/manage/brands');
    return data;
  }

  async updateVenue(id: string, updates: Record<string, any>) {
    const { data } = await this.client.put(`/manage/venues/${id}`, updates);
    return data;
  }

  async updateEvent(id: string, updates: Record<string, any>) {
    const { data } = await this.client.put(`/manage/events/${id}`, updates);
    return data;
  }

  async updateBrand(id: string, updates: Record<string, any>) {
    const { data } = await this.client.put(`/manage/brands/${id}`, updates);
    return data;
  }

  // ==========================================
  // Menu endpoints
  // ==========================================

  async getVenueMenu(venueId: string) {
    const { data } = await this.client.get(`/manage/venues/${venueId}/menu/categories`);
    return data;
  }

  async getPublicMenu(venueId: string) {
    const { data } = await this.client.get(`/venues/${venueId}/menu`);
    return data;
  }

  async createMenuCategory(venueId: string, categoryData: {
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    const { data } = await this.client.post(`/manage/venues/${venueId}/menu/categories`, categoryData);
    return data;
  }

  async updateMenuCategory(categoryId: string, updates: Record<string, any>) {
    const { data } = await this.client.put(`/manage/menu/categories/${categoryId}`, updates);
    return data;
  }

  async deleteMenuCategory(categoryId: string) {
    const { data } = await this.client.delete(`/manage/menu/categories/${categoryId}`);
    return data;
  }

  async createMenuItem(categoryId: string, itemData: {
    name: string;
    description?: string;
    type: string;
    price: number;
    isAvailable?: boolean;
  }) {
    const { data } = await this.client.post(`/manage/menu/categories/${categoryId}/items`, itemData);
    return data;
  }

  async updateMenuItem(itemId: string, updates: Record<string, any>) {
    const { data } = await this.client.put(`/manage/menu/items/${itemId}`, updates);
    return data;
  }

  async deleteMenuItem(itemId: string) {
    const { data } = await this.client.delete(`/manage/menu/items/${itemId}`);
    return data;
  }

  // ==========================================
  // Order endpoints
  // ==========================================

  async createOrder(venueId: string) {
    const { data } = await this.client.post('/orders', { venueId });
    return data;
  }

  async getMyOrders() {
    const { data } = await this.client.get('/orders/my');
    return data;
  }

  async getOrder(id: string) {
    const { data } = await this.client.get(`/orders/${id}`);
    return data;
  }

  async addOrderItem(orderId: string, item: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }) {
    const { data } = await this.client.post(`/orders/${orderId}/items`, item);
    return data;
  }

  async removeOrderItem(orderId: string, itemId: string) {
    const { data } = await this.client.delete(`/orders/${orderId}/items/${itemId}`);
    return data;
  }

  async checkoutOrder(orderId: string) {
    const { data } = await this.client.post(`/orders/${orderId}/checkout`);
    return data;
  }

  async getVenueOrders(venueId: string) {
    const { data } = await this.client.get(`/manage/venues/${venueId}/orders`);
    return data;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const { data } = await this.client.put(`/manage/orders/${orderId}/status`, { status });
    return data;
  }

  // ==========================================
  // Upload endpoints
  // ==========================================

  async uploadFile(file: File, entityType?: string, entityId?: string) {
    const formData = new FormData();
    formData.append('file', file);

    let url = '/uploads';
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    if (params.toString()) url += `?${params.toString()}`;

    const { data } = await this.client.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async deleteFile(fileId: string) {
    const { data } = await this.client.delete(`/uploads/${fileId}`);
    return data;
  }
}

export const api = new ApiClient();
export default api;
