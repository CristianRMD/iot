const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Conectar a MongoDB Atlas (o local)
mongoose.connect('mongodb+srv://user_node_cafe:HVyroHLNS0NFguq4@miclustercafe.egjou.mongodb.net/iot', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.log('Error de conexión', err));

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Crear esquema y modelo para los datos del sensor
const sensorSchema = new mongoose.Schema({
  valor: Number,
  timestamp: Date
});
const SensorData = mongoose.model('SensorData', sensorSchema);

// Ruta para recibir datos del ESP32
app.post('/api/datos', async (req, res) => {
  const { valor } = req.body;
  const newData = new SensorData({
    valor,
    timestamp: new Date()
  });
  
  try {
    await newData.save();
    res.status(201).send('Datos guardados en MongoDB');
  } catch (err) {
    res.status(500).send('Error al guardar los datos');
  }
});

app.listen(port, () => {
  console.log(`API en http://localhost:${port}`);
});
