import axios from 'axios';

export const authService = {
  async signup(data: any) {
    const res = await axios.post('/api/auth/signup', data);
    return res.data;
  },

  async login(identifier: string, password: string) {
    const res = await axios.post('/api/auth/login', { identifier, password });
    return res.data;
  },

  async logout(token: string) {
    const res = await axios.post('/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  async logoutAll(token: string) {
    const res = await axios.post('/api/auth/logout-all', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  async getCurrentUser(token: string) {
    const res = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  async verifyEmail(user_id: string, code: string) {
    const res = await axios.post('/api/auth/verify-email', { user_id, code });
    return res.data;
  },

  async verifyPhone(user_id: string, code: string) {
    const res = await axios.post('/api/auth/verify-phone', { user_id, code });
    return res.data;
  },

  async resendVerification(user_id: string, type: 'email' | 'phone') {
    const res = await axios.post('/api/auth/resend-verification', { user_id, type });
    return res.data;
  },

  async forgotPassword(identifier: string) {
    const res = await axios.post('/api/auth/forgot-password', { identifier });
    return res.data;
  },

  async resetPassword(token: string, new_password: string) {
    const res = await axios.post('/api/auth/reset-password', { token, new_password });
    return res.data;
  },

  async socialLogin(provider: string, profile: { email: string; first_name?: string; last_name?: string }) {
    const res = await axios.post('/api/auth/social', { provider, ...profile });
    return res.data;
  },

  async getOAuthConfig() {
    const res = await axios.get('/api/settings/oauth');
    return res.data;
  },

  async saveOAuthConfig(config: any) {
    const res = await axios.post('/api/settings/oauth', config);
    return res.data;
  }
};
