// server.js - WebSocket server to broadcast climate data updates from Postgres
import http from "http";

import { Client } from "pg";
import { WebSocketServer } from "ws";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
if (!process.env.POSTGRES_URL) {
  console.error("Error: POSTGRES_URL environment variable is required");
  console.error("Please set POSTGRES_URL in .env file, for example:");
  console.error(
    "POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/automotive",
  );
  process.exit(1);
}
if (!process.env.EXPO_PUBLIC_WS_SERVER_URL) {
  console.error(
    "Error: EXPO_PUBLIC_WS_SERVER_URL environment variable is required",
  );
  process.exit(1);
}
if (!process.env.EXPO_PUBLIC_HTTP_SERVER_URL) {
  console.error(
    "Error: EXPO_PUBLIC_HTTP_SERVER_URL environment variable is required",
  );
  process.exit(1);
}

/**
 * Replace localhost with 0.0.0.0 for server binding
 * This allows the server to accept connections from any interface
 */
function replaceLocalhostForServerBinding(url) {
  if (url.includes("localhost")) {
    return url.replace("localhost", "0.0.0.0");
  }

  return url;
}

// Parse server URLs and convert localhost to 0.0.0.0 for binding
const wsUrlForBinding = replaceLocalhostForServerBinding(
  process.env.EXPO_PUBLIC_WS_SERVER_URL,
);
const httpUrlForBinding = replaceLocalhostForServerBinding(
  process.env.EXPO_PUBLIC_HTTP_SERVER_URL,
);

const wsUrl = new URL(wsUrlForBinding);
const httpUrl = new URL(httpUrlForBinding);

const WS_HOST = wsUrl.hostname;
const WS_PORT = parseInt(wsUrl.port);
const HTTP_HOST = httpUrl.hostname;
const HTTP_PORT = parseInt(httpUrl.port);

async function start() {
  // 這裡要監聽 automotive 資料庫的 ac_settings 和 vehicle_info 表的變更
  // 跟 init_db.tsx 不同 因為那邊是在創建資料庫
  const connectionString = `${process.env.POSTGRES_URL}/automotive`;
  const client = new Client({ connectionString });

  await client.connect();
  console.log("Connected to PostgreSQL for WS.");

  // Setup HTTP server for REST fallback
  const app = express();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  });
  app.get("/state", async (req, res) => {
    try {
      const result = await client.query("SELECT * FROM ac_settings LIMIT 1");

      if (result.rows[0]) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: "No state found" });
      }
    } catch (err) {
      console.error("HTTP /state error", err);
      res.status(500).json({ error: "Server error" });
    }
  });
  const httpServer = http.createServer(app);

  httpServer.listen(HTTP_PORT, HTTP_HOST, () =>
    console.log(
      `HTTP server running on ${process.env.EXPO_PUBLIC_HTTP_SERVER_URL}`,
    ),
  );

  // Listen to ac_settings updates
  await client.query("LISTEN ac_settings_update");
  console.log("Listening to ac_settings_update channel.");
  // Listen to vehicle_info updates
  await client.query("LISTEN vehicle_info_update");
  console.log("Listening to vehicle_info_update channel.");

  // Setup WebSocket server
  const wss = new WebSocketServer({ port: WS_PORT, host: WS_HOST });

  console.log(
    `WebSocket server running on ${process.env.EXPO_PUBLIC_WS_SERVER_URL}`,
  );

  wss.on("connection", async (ws) => {
    console.log("Client connected");
    // Send current state
    try {
      const res = await client.query("SELECT * FROM ac_settings LIMIT 1");

      if (res.rows[0]) {
        ws.send(JSON.stringify(res.rows[0]));
      }
      // Send current vehicle info state
      const resV = await client.query("SELECT * FROM vehicle_info LIMIT 1");

      if (resV.rows[0]) {
        ws.send(JSON.stringify(resV.rows[0]));
      }
    } catch (err) {
      console.error("Error fetching initial data", err);
    }

    // On DB notification, send to client
    const handler = (msg) => {
      console.log("[DB_NOTIFY]", msg.channel, msg.payload);
      if (
        msg.channel === "ac_settings_update" ||
        msg.channel === "vehicle_info_update"
      ) {
        ws.send(msg.payload);
      }
    };

    client.on("notification", handler);

    ws.on("close", () => {
      client.removeListener("notification", handler);
    });
    // Handle incoming messages to update climate settings
    ws.on("message", async (message) => {
      let data;

      try {
        data = JSON.parse(message);
      } catch (e) {
        console.error("Invalid message format", e);

        return;
      }
      // If client requests initial state
      if (data.action === "get_state") {
        try {
          const res = await client.query("SELECT * FROM ac_settings LIMIT 1");

          if (res.rows[0]) {
            ws.send(JSON.stringify(res.rows[0]));
          }
          // Also send vehicle state
          const resV = await client.query("SELECT * FROM vehicle_info LIMIT 1");

          if (resV.rows[0]) {
            ws.send(JSON.stringify(resV.rows[0]));
          }
        } catch (err) {
          console.error("Error fetching state on demand", err);
        }

        return;
      }
      // Update allowed climate fields
      const allowedFields = [
        "air_conditioning",
        "fan_speed",
        "airflow_head_on",
        "airflow_body_on",
        "airflow_feet_on",
        "auto_on",
        "front_defrost_on",
        "rear_defrost_on",
        "temperature",
      ];

      for (const key of Object.keys(data)) {
        if (allowedFields.includes(key)) {
          try {
            await client.query(`UPDATE ac_settings SET ${key} = $1`, [
              data[key],
            ]);
          } catch (err) {
            console.error(`Error updating ${key}`, err);
          }
        }
      }
      // Update allowed vehicle info warning fields
      const allowedVehicleFields = [
        "engine_warning",
        "oil_pressure_warning",
        "battery_warning",
        "coolant_temp_warning",
        "brake_warning",
        "abs_warning",
        "tpms_warning",
        "airbag_warning",
        "low_fuel_warning",
        "door_ajar_warning",
        "seat_belt_warning",
        "exterior_light_failure_warning",
      ];

      for (const key of Object.keys(data)) {
        if (allowedVehicleFields.includes(key)) {
          try {
            await client.query(`UPDATE vehicle_info SET ${key} = $1`, [
              data[key],
            ]);
          } catch (err) {
            console.error(`Error updating vehicle field ${key}`, err);
          }
        }
      }
    });
  });
}

start().catch((err) => console.error(err));
