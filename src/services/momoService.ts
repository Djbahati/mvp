import { computeHash } from './ledgerEngine';

export interface MoMoPushRequest {
  phoneNumber: string;
  amount: number;
  currency: 'RWF' | 'KES' | 'UGX';
  provider: 'MTN_RWANDA' | 'AIRTEL_AFRICA';
  reference: string;
}

export interface MoMoPushResponse {
  status: 'PENDING_USSD' | 'FAILED';
  provider_tx_ref: string;
  instructions: string;
  nonce: string;
  timestamp: string;
}

export async function initiateMoMoCollection(req: MoMoPushRequest): Promise<MoMoPushResponse> {
  const nonce = 'nc_' + Math.random().toString(36).substring(2, 12);
  const timestamp = new Date().toISOString();
  const providerRef = `${req.provider === 'MTN_RWANDA' ? 'MTN' : 'AIR'}-${Math.floor(100000000 + Math.random() * 900000000)}`;

  return {
    status: 'PENDING_USSD',
    provider_tx_ref: providerRef,
    instructions: `USSD Prompt sent to ${req.phoneNumber}. Please enter your Mobile Money PIN on your handset to approve ${req.amount.toLocaleString()} ${req.currency}.`,
    nonce,
    timestamp
  };
}

export async function generateWebhookSignature(payload: string, secretKey: string): Promise<string> {
  const signatureInput = `${payload}:${secretKey}`;
  const signature = await computeHash(signatureInput);
  return `sha256=${signature}`;
}

export async function verifyWebhookSignature(
  payload: string,
  providedSignature: string,
  secretKey: string
): Promise<boolean> {
  const expected = await generateWebhookSignature(payload, secretKey);
  return expected === providedSignature;
}
