require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const Camera = require('./models/Camera');

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server for both Express + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Listen for client connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve Montenegro GeoJSON (place montenegro.geojson in backend/data/)
app.get('/geojson/mne', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'montenegro.geojson'));
});

// CRUD for cameras
app.get('/api/cameras', async (req, res) => {
  const cams = await Camera.find().sort({ createdAt: -1 });
  res.json(cams);
});

app.post('/api/cameras', async (req, res) => {
  try {
    const cam = new Camera(req.body);
    await cam.save();
    io.emit('cameraUpdate', cam); // broadcast creation
    res.status(201).json(cam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cameras/:id', async (req, res) => {
  try {
    const cam = await Camera.findByIdAndUpdate(req.params.id, req.body, { new: true });
    io.emit('cameraUpdate', cam); // broadcast updates
    res.json(cam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cameras/:id', async (req, res) => {
  try {
    await Camera.findByIdAndDelete(req.params.id);
    io.emit('cameraRemoved', req.params.id); // broadcast deletion
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Raspberry Pi sends status logs
app.post('/api/logs', async (req, res) => {
  const { cameraId, log } = req.body;
  try {
    const cam = await Camera.findByIdAndUpdate(
      cameraId,
      { lastLog: log, updatedAt: new Date() },
      { new: true }
    );
    io.emit('cameraUpdate', cam); // notify UI
    res.json(cam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Raspberry Pi sends fire alert
app.post('/api/alert', async (req, res) => {
  const { cameraId, alertType } = req.body;
  try {
    const cam = await Camera.findByIdAndUpdate(
      cameraId,
      { status: alertType || 'fire', updatedAt: new Date() },
      { new: true }
    );
    io.emit('cameraAlert', cam); // send real-time event
    res.json(cam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Connect DB and start
const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error', err));
