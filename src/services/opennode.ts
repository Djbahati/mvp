import axios from 'axios';
import crypto from 'crypto';

export interface OpenNodeWithdrawRequest {
  amount: number;
  address: string; // Lightning BOLT11 invoice or bitcoin address
  callback_url?: string;
}

export interface OpenNodeWithdrawResponse {
  id: string;
  status: string;
  amount: number;
  fee: number;
  reference?: string;
  address: string;
  created_at: number;
}

export interface OpenNodeBalanceResponse {
  balance: Record<string, number>;
}

export class OpenNodeClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl; // local proxy endpoints /api/opennode/...
  }

  async getBalance(): Promise<OpenNodeBalanceResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/opennode/balance`);
      return response.data;
    } catch (error: any) {
      console.error('OpenNode getBalance error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch OpenNode balance');
    }
  }

  async initiateWithdrawal(amount: number, address: string, callbackUrl?: string): Promise<OpenNodeWithdrawResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/opennode/withdraw`, {
        amount,
        address,
        callback_url: callbackUrl
      });
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('OpenNode initiateWithdrawal error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to initiate OpenNode withdrawal');
    }
  }

  async requestRefund(checkoutId: string, address: string, email?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/opennode/refund`, {
        checkout_id: checkoutId,
        address,
        email
      });
      return response.data;
    } catch (error: any) {
      console.error('OpenNode requestRefund error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to request OpenNode refund');
    }
  }

  verifyWebhookSignature(apiKey: string, orderId: string, hashedOrder: string): boolean {
    try {
      const calculated = crypto
        .createHmac('sha256', apiKey)
        .update(orderId)
        .digest('hex');
      return calculated === hashedOrder;
    } catch (e) {
      return false;
    }
  }
}
