import axios from 'axios';

const BASE_URL = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

function baseUrl() {
  return BASE_URL[process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox'];
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  const res = await axios.get(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  return res.data.access_token;
}

/**
 * Triggers an STK push ("Lipa na M-PESA Online") prompt on the
 * customer's phone. Safaricom responds immediately with just an
 * acknowledgement (CheckoutRequestID) — the actual payment result
 * (success, cancelled, insufficient funds, timeout) arrives later as
 * an asynchronous POST to MPESA_CALLBACK_URL, handled in server.js.
 */
export async function stkPush({ phone, amount, accountRef, description }) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');

  const res = await axios.post(
    `${baseUrl()}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountRef,
      TransactionDesc: description
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}
