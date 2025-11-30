// server/index.js
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Token cache
let accessToken = null;

// Function to obtain a new access token using client credentials
async function getAccessToken() {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET must be set");
  }

  try {
    const tokenUrl = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
    
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (err) {
    console.error("Error obtaining access token:", err.message);
    throw new Error("Failed to obtain access token");
  }
}

// Simple “health check”
app.get("/", (req, res) => {
  res.send("Flight tracker backend is running");
});

// GET /api/flights?lamin=...&lomin=...&lamax=...&lomax=...
app.get("/api/flights", async (req, res) => {
  try {
    // Default: a rough box around Los Angeles (change as you like)
    const {
      lamin = 33.5,
      lomin = -119.0,
      lamax = 34.5,
      lomax = -117.5,
    } = req.query;

    const url = "https://opensky-network.org/api/states/all";

    const makeRequest = async (authToken) => {
      const axiosConfig = {
        params: { lamin, lomin, lamax, lomax, extended: 1 },
        headers: { Authorization: `Bearer ${authToken}` },
      };

      return await axios.get(url, axiosConfig);
    };

    let response;
    try {
      // If no token available, get one first
      if (!accessToken) {
        console.log("No access token available, obtaining new token...");
        accessToken = await getAccessToken();
      }
      
      response = await makeRequest(accessToken);
    } catch (err) {
      // Handle 401 Unauthorized - token expired or invalid
      if (err.response?.status === 401) {
        console.log("Received 401, obtaining new access token...");
        
        // Get a fresh token using client credentials
        accessToken = await getAccessToken();
        
        // Retry the request with the new token
        response = await makeRequest(accessToken);
      } else {
        throw err;
      }
    }

    res.json(response.data);
  } catch (err) {
    console.error("Error fetching flights", err.message);
    res.status(500).json({ error: "Failed to fetch flights" });
  }
});

// Initialize access token on startup
async function startServer() {
  try {
    console.log("Obtaining initial access token...");
    accessToken = await getAccessToken();
    console.log("Access token obtained successfully");
  } catch (err) {
    console.error("Failed to obtain initial access token:", err.message);
    console.error("Server will start, but API requests may fail until token is obtained");
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();