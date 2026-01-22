const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env.azure") });

const topicEndpoint = process.env.AZURE_EVENTGRID_TOPIC_ENDPOINT;
const accessKey = process.env.AZURE_EVENTGRID_ACCESS_KEY;

async function publishEvent(eventType, data) {
  const event = {
    id: Date.now().toString(),
    subject: eventType,
    dataVersion: "1.0",
    eventType: eventType,
    data: data,
    eventTime: new Date().toISOString(),
  };

  try {
    await axios.post(topicEndpoint, [event], {
      headers: {
        "aeg-sas-key": accessKey,
        "Content-Type": "application/json",
      },
    });
    console.log(`Event published: ${eventType}`);
  } catch (error) {
    console.error(`Error publishing event ${eventType}:`, error.response?.data || error.message);
  }
}

module.exports = { publishEvent };