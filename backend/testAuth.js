
require("dotenv").config();
const axios = require("axios");

async function testAuth() {
  try {
    const response = await axios.post(
      "https://api.sandbox.africastalking.com/version1/messaging",
      {
        username: process.env.AT_USERNAME,
        to: "+254793877192",
        message: "Sandbox authentication test",
      },
      {
        headers: {
          apiKey: process.env.AT_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        transformRequest: [
          (data) => new URLSearchParams(data).toString(),
        ],
      }
    );

    console.log("HTTP status:", response.status);
    console.log("Response:", response.data);
  } catch (error) {
    console.log("HTTP status:", error.response?.status);
    console.log("Response:", error.response?.data || error.message);
  }
}

testAuth();
