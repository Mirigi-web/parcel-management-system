
const AfricasTalking = require("africastalking");

const username = process.env.AT_USERNAME;
const apiKey = process.env.AT_API_KEY;

let smsClient = null;

if (username && apiKey) {
  const africasTalking = AfricasTalking({
    username,
    apiKey,
  });

  smsClient = africasTalking.SMS;
}

/**
 * Send an SMS using Africa's Talking.
 * Phone numbers should use international format, e.g. +2547XXXXXXXX.
 */
async function sendSMS(phoneNumber, message) {
  if (!smsClient) {
    return {
      success: false,
      message: "SMS is not configured. Check AT_USERNAME and AT_API_KEY.",
    };
  }

  if (!phoneNumber || !message) {
    return {
      success: false,
      message: "Phone number and message are required.",
    };
  }

  try {
    const response = await smsClient.send({
      to: [phoneNumber],
      message,
    });

    console.log("Africa's Talking SMS response:", response);

    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error(
  "SMS sending failed:",
  error.response?.data || error.message
);

    return {
      success: false,
      message: error.message || "SMS sending failed.",
    };
  }
}

module.exports = { sendSMS };
