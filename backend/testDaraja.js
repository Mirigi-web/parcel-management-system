
require("dotenv").config();

const { getAccessToken } = require("./services/darajaService");

async function testDaraja() {
  try {
    console.log("Testing Safaricom Daraja authentication...");

    const token = await getAccessToken();

    if (token) {
      console.log("SUCCESS: Daraja authentication is working.");
      console.log("An access token was received. Credentials are valid.");
    }
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

testDaraja();
