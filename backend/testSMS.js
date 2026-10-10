
require("dotenv").config();

const { sendSMS } = require("./services/smsService");

async function testSMS() {
  // Replace this with a phone number you control.
  // Example Kenyan format: +2547XXXXXXXX
  const phoneNumber = "+254793877192";

  const message =
    "Test message from the Parcel Management and Tracking System.";

  console.log("Testing SMS configuration...");

  const result = await sendSMS(phoneNumber, message);

  if (result.success) {
    console.log("SMS request completed. Check the provider response.");
  } else {
    console.log("SMS test failed:", result.message);
  }
}

testSMS();
