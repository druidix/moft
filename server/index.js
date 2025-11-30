// server/index.js
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

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

    //basic auth is no longer supported. Use API key instead.
    const apiKey = process.env.OPENSKY_API_KEY;
    // const username = process.env.OPENSKY_USERNAME;
    // const password = process.env.OPENSKY_PASSWORD;

    const axiosConfig = {
      params: { lamin, lomin, lamax, lomax, extended: 1 },
    };

    if (apiKey) {
      axiosConfig.headers = { 'Authorization': `Bearer ${apiKey}` };
    }

    const response = await axios.get(url, axiosConfig);

    res.json(response.data);
  } catch (err) {
    console.error("Error fetching flights", err.message);
    res.status(500).json({ error: "Failed to fetch flights" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
