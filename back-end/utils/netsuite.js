const axios = require("axios");
const crypto = require("crypto");
const OAuth = require("oauth-1.0a");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// ================================
// NetSuite Configuration
// ================================
const netsuiteConfig = {
  apiUrl:
    "https://5798280-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=4595&deploy=1",
  consumerKey: process.env.NETSUITE_CONSUMER_KEY || "3033133f7ca30f87e04505fb356a63ee806c7715f61076762177e52b92848f97",
  consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || "8aaeb9604707a8b5c99088475ec391e8a68631c50aa6068387b691f414c53b96",
  tokenId: process.env.NETSUITE_ACCESS_TOKEN || "77ca47c9703a6de7e02befdeadead25009c0125d07a79f8ae645a38d564e48ff",
  tokenSecret: process.env.NETSUITE_ACCESS_TOKEN_SECRET || "e84bcd10cb4acafd9ffbb64679003a103ab17b8d8b9372be3bebf1a3a9b8ca1e",
  realm: process.env.NETSUITE_REALM || "5798280_SB1"
};

// ================================
// OAuth Initialization
// ================================
const oauth = OAuth({
  consumer: {
    key: netsuiteConfig.consumerKey,
    secret: netsuiteConfig.consumerSecret
  },
  signature_method: "HMAC-SHA256",
  hash_function(base_string, key) {
    return crypto
      .createHmac("sha256", key)
      .update(base_string)
      .digest("base64");
  }
});

const token = {
  key: netsuiteConfig.tokenId,
  secret: netsuiteConfig.tokenSecret
};

// ================================
// NetSuite API Call
// ================================
async function callNetSuiteAPI(orderData) {
  try {
    // Remove script and deploy from body data
    const bodyData = { ...orderData };
    delete bodyData.script;
    delete bodyData.deploy;

    const bodyString = JSON.stringify(bodyData);

    const requestData = {
      url: netsuiteConfig.apiUrl,
      method: "POST"
    };

    // Generate OAuth authorization
    const authData = oauth.authorize(requestData, token);
    
    // Build the OAuth header manually to ensure proper formatting
    const oauthParams = {
      oauth_consumer_key: netsuiteConfig.consumerKey,
      oauth_token: netsuiteConfig.tokenId,
      oauth_signature_method: authData.oauth_signature_method,
      oauth_timestamp: authData.oauth_timestamp,
      oauth_nonce: authData.oauth_nonce,
      oauth_version: authData.oauth_version,
      oauth_signature: authData.oauth_signature,
      realm: netsuiteConfig.realm
    };

    // Format as NetSuite expects: realm first, then alphabetically sorted params
    const authorization = 'OAuth realm="' + netsuiteConfig.realm + '",' +
      'oauth_consumer_key="' + oauthParams.oauth_consumer_key + '",' +
      'oauth_nonce="' + oauthParams.oauth_nonce + '",' +
      'oauth_signature="' + encodeURIComponent(oauthParams.oauth_signature) + '",' +
      'oauth_signature_method="' + oauthParams.oauth_signature_method + '",' +
      'oauth_timestamp="' + oauthParams.oauth_timestamp + '",' +
      'oauth_token="' + oauthParams.oauth_token + '",' +
      'oauth_version="' + oauthParams.oauth_version + '"';

    console.log("Generated Authorization header:", authorization);
    console.log("Request URL:", netsuiteConfig.apiUrl);
    console.log("Request Body:", bodyString);

    const response = await axios.post(
      netsuiteConfig.apiUrl,
      bodyString,
      {
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      }
    );

    console.log("NetSuite API Success:", response.data);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(
      "NetSuite API call failed:",
      error.response?.data || error.message
    );

    // More detailed error logging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

module.exports = { callNetSuiteAPI };