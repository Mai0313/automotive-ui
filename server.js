// server.js - WebSocket server to broadcast climate data updates from Postgres
process.env.POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/automotive';
import { Client } from 'pg';
import { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';

async function start() {
  const connectionString = process.env.POSTGRES_URL;
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL for WS.');

  // Setup HTTP server for REST fallback
  const app = express();
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  app.get('/state', async (req, res) => {
    try {
      const result = await client.query('SELECT * FROM dev_user LIMIT 1');
      if (result.rows[0]) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'No state found' });
      }
    } catch (err) {
      console.error('HTTP /state error', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  const httpServer = http.createServer(app);
  httpServer.listen(4001, () => console.log('HTTP server running on http://localhost:4001'));

  // Listen to dev_user updates
  await client.query('LISTEN dev_user_update');
  console.log('Listening to dev_user_update channel.');

  // Setup WebSocket server
  const wss = new WebSocketServer({ port: 4000 });
  console.log('WebSocket server running on ws://localhost:4000');

  wss.on('connection', async (ws) => {
    console.log('Client connected');
    // Send current state
    try {
      const res = await client.query('SELECT * FROM dev_user LIMIT 1');
      if (res.rows[0]) {
        ws.send(JSON.stringify(res.rows[0]));
      }
    } catch (err) {
      console.error('Error fetching initial data', err);
    }

    // On DB notification, send to client
    const handler = (msg) => {
      console.log('[DB_NOTIFY]', msg.payload);
      if (msg.channel === 'dev_user_update') {
        ws.send(msg.payload);
      }
    };
    client.on('notification', handler);

    ws.on('close', () => {
      client.removeListener('notification', handler);
    });
    // Handle incoming messages to update climate settings
    ws.on('message', async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (e) {
        console.error('Invalid message format', e);
        return;
      }
      // If client requests initial state
      if (data.action === 'get_state') {
        try {
          const res = await client.query('SELECT * FROM dev_user LIMIT 1');
          if (res.rows[0]) {
            ws.send(JSON.stringify(res.rows[0]));
          }
        } catch (err) {
          console.error('Error fetching state on demand', err);
        }
        return;
      }
      // Update allowed climate fields
      const allowedFields = [
        'air_conditioning',
        'fan_speed',
        'airflow_head_on',
        'airflow_body_on',
        'airflow_feet_on',
        'front_defrost_on', // 新增
        'rear_defrost_on',  // 新增
        'temperature',
      ];
      for (const key of Object.keys(data)) {
        if (allowedFields.includes(key)) {
          try {
            await client.query(
              `UPDATE dev_user SET ${key} = $1`,
              [data[key]]
            );
          } catch (err) {
            console.error(`Error updating ${key}`, err);
          }
        }
      }
    });
  });
}

start().catch(err => console.error(err));
