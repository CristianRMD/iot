const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Conectar a MongoDB Atlas (o local)
mongoose.connect('mongodb+srv://user_node_cafe:HVyroHLNS0NFguq4@miclustercafe.egjou.mongodb.net/iot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.log('Error de conexión', err));

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Crear esquema y modelo para los datos del sensor
const sensorSchema = new mongoose.Schema({
  IR: Number,
  BPM: Number,
  SpO2: Number,
  Movimiento: String,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', sensorSchema);

// Ruta para recibir datos del ESP32
app.post('/api/datos', async (req, res) => {
  const { IR, BPM, SpO2, Movimiento } = req.body;
  
  const newData = new SensorData({
    IR,
    BPM,
    SpO2,
    Movimiento
  });
  
  try {
    await newData.save();
    res.status(201).json({ message: 'Datos guardados correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al guardar los datos', error: err });
  }
});

// Ruta para obtener los últimos datos almacenados
app.get('/api/datos', async (req, res) => {
  try {
    const datos = await SensorData.find().sort({ timestamp: -1 }).limit(10);
    res.status(200).json(datos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});

app.listen(port, () => {
  console.log(`API corriendo en http://localhost:${port}`);
});
