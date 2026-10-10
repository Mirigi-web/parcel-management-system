
const DARAJA_BASE_URL =
  process.env.DARAJA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

async function getAccessToken() {
  const consumerKey = getRequiredEnv("DARAJA_CONSUMER_KEY");
  const consumerSecret = getRequiredEnv("DARAJA_CONSUMER_SECRET");

  const credentials = Buffer.from(
    `${consumerKey}:${consumerSecret}`
  ).toString("base64");

  const response = await fetch(
    `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Daraja authentication failed: ${
        data.errorMessage || data.error || response.status
      }`
    );
  }

  return data.access_token;
}

function getTimestamp() {
  const now = new Date();

  // Daraja transaction timestamps use the Kenya local clock.
  const kenyaTime = new Date(
    now.getTime() + 3 * 60 * 60 * 1000
  );

  return kenyaTime
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
}

function createStkPassword(shortcode, passkey, timestamp) {
  return Buffer.from(
    `${shortcode}${passkey}${timestamp}`
  ).toString("base64");
}

async function initiateStkPush({
  phoneNumber,
  amount,
  trackingNumber,
  callbackUrl,
}) {
  const shortcode = getRequiredEnv("DARAJA_SHORTCODE");
  const passkey = getRequiredEnv("DARAJA_PASSKEY");

  if (!callbackUrl || !/^https?:\/\//i.test(callbackUrl)) {
    throw new Error(
      "A reachable Daraja callback URL must be configured"
    );
  }

  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = createStkPassword(
    shortcode,
    passkey,
    timestamp
  );

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: trackingNumber.slice(0, 12),
    TransactionDesc: "Parcel payment",
  };

  const response = await fetch(
    `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    }
  );

  const data = await response.json();

  if (!response.ok || data.ResponseCode !== "0") {
    throw new Error(
      `STK Push request failed: ${
        data.errorMessage ||
        data.ResponseDescription ||
        data.ResponseCode ||
        response.status
      }`
    );
  }

  return data;
}

module.exports = {
  getAccessToken,
  initiateStkPush,
};
