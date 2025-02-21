require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Inicializar Firebase con variables de entorno
admin.initializeApp({
  credential: admin.credential.cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
const realtimeDb = admin.database();

const port = process.env.PORT || 3000;
  
  // 📌 1️⃣ POST - Guardar datos en Firestore después de obtener el índice desde Realtime Database
  app.post("/api/procesar", async (req, res) => {
    try {
      const { Ir, BPM, Sop, Movimiento } = req.body;
  
      // 📌 Obtener el índice desde Realtime Database
      const movimientoRef = realtimeDb.ref(`movimientos/${Movimiento}`);
      const snapshot = await movimientoRef.once("value");
      const index = snapshot.val() || 0;
  
      // 📌 Guardar en Firestore
      await db.collection("datos").add({
        Ir,
        BPM,
        Sop,
        Movimiento,
        index,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
  
      res.json({ message: "Datos guardados en Firestore", index });
    } catch (err) {
      res.status(500).json({ message: "Error al procesar datos", error: err });
    }
  });
  
  // 📌 2️⃣ GET - Obtener solo movimiento e índice desde Firestore
  app.get("/api/datos", async (req, res) => {
    try {
      const snapshot = await db
        .collection("datos")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();
  
      if (snapshot.empty) {
        return res.json({ message: "No hay datos disponibles" });
      }
  
      const ultimoDato = snapshot.docs[0].data();
      res.json({
        Movimiento: ultimoDato.Movimiento,
        index: ultimoDato.index,
      });
    } catch (err) {
      res.status(500).json({ message: "Error al obtener el último dato", error: err });
    }
  });
  
  
  // 📌 3️⃣ POST - Actualizar el índice en Realtime Database
  app.post("/api/actualizar-movimiento", async (req, res) => {
    try {
      const { Movimiento, index } = req.body;
  
      await realtimeDb.ref(`movimientos/${Movimiento}`).set(index);
      res.json({ message: "Movimiento actualizado en Realtime Database" });
    } catch (err) {
      res.status(500).json({ message: "Error al actualizar movimiento", error: err });
    }
  });
  
  // 📌 4️⃣ GET - Obtener los últimos 50 datos y extraer IR en un array
  app.get("/api/ultimos-ir", async (req, res) => {
    try {
      const snapshot = await db
        .collection("datos")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();
  
      const irData = snapshot.docs.map((doc) => doc.data().Ir);
      res.json(irData);
    } catch (err) {
      res.status(500).json({ message: "Error al obtener IR", error: err });
    }
  });
  
  // 📌 5️⃣ GET - Obtener los primeros 50 datos y extraer BPM en un array
  app.get("/api/primeros-bpm", async (req, res) => {
    try {
      const snapshot = await db
        .collection("datos")
        .orderBy("timestamp", "asc")
        .limit(50)
        .get();
  
      const bpmData = snapshot.docs.map((doc) => doc.data().BPM);
      res.json(bpmData);
    } catch (err) {
      res.status(500).json({ message: "Error al obtener BPM", error: err });
    }
  });
  
  // 📌 Iniciar servidor
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
  