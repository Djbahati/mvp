import axios from 'axios';

export interface LNbitsWallet {
  id?: string;
  name?: string;
  balance: number;
  currency?: string;
}

export interface LNbitsPaymentResponse {
  payment_hash?: string;
  checking_id?: string;
  bolt11?: string;
  fee?: number;
  preimage?: string;
  success?: boolean;
}

export class LNbitsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = '') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl; // if empty, uses local proxy /api/lnbits/...
  }

  async getWallet(): Promise<LNbitsWallet> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/lnbits/wallet`, {
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('LNbits getWallet error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch LNbits wallet');
    }
  }

  async createInvoice(amount: number, memo: string): Promise<LNbitsPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/lnbits/payments`,
        { out: false, amount, memo },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('LNbits createInvoice error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to create invoice');
    }
  }

  async payInvoice(bolt11: string): Promise<LNbitsPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/lnbits/payments`,
        { out: true, bolt11 },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('LNbits payInvoice error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to pay invoice');
    }
  }
}
