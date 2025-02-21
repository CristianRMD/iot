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
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Corrige saltos de línea
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();
const realtimeDb = admin.database();

const port = process.env.PORT || 3000;

// 📌 1️⃣ POST - Guardar datos de sensores en Firestore
app.post("/api/guardar-datos", async (req, res) => {
  try {
    const { Ir, BPM, Sop2 } = req.body;

    // Guardar en la colección "datos_sensores"
    await db.collection("datos_sensores").add({
      Ir,
      BPM,
      Sop2,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "Datos de sensores guardados correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al guardar datos", error: err });
  }
});

// 📌 3️⃣ POST - Actualizar el índice en Realtime Database
app.post("/api/actualizar-movimiento", async (req, res) => {
  try {
    const { Movimiento, index } = req.body;

    // 📌 Actualizar el índice en Realtime Database
    await realtimeDb.ref(`movimientos/${Movimiento}`).set(index);

    res.json({ message: "Movimiento actualizado en Realtime Database", Movimiento, index });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar movimiento", error: err });
  }
});


// 📌 2️⃣ POST - Guardar movimiento con índice en Firestore
app.post("/api/guardar-movimiento", async (req, res) => {
  try {
    const { Movimiento } = req.body;

    // Obtener el índice desde Realtime Database
    const movimientoRef = realtimeDb.ref(`movimientos/${Movimiento}`);
    const snapshot = await movimientoRef.once("value");
    const index = snapshot.val() || 0;

    // Guardar en la colección "movimientos"
    await db.collection("movimientos").add({
      Movimiento,
      index,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "Movimiento guardado correctamente", index });
  } catch (err) {
    res.status(500).json({ message: "Error al guardar movimiento", error: err });
  }
});

// 📌 3️⃣ GET - Obtener el último movimiento y su índice
app.get("/api/datos", async (req, res) => {
  try {
    const snapshot = await db
      .collection("movimientos")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ message: "No hay movimientos registrados" });
    }

    const ultimoMovimiento = snapshot.docs[0].data();
    res.json({
      Movimiento: ultimoMovimiento.Movimiento,
      index: ultimoMovimiento.index,
    });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener el último movimiento", error: err });
  }
});

// 📌 4️⃣ GET - Obtener los últimos 50 valores de IR
app.get("/api/ultimos-ir", async (req, res) => {
  try {
    const snapshot = await db
      .collection("datos_sensores")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const irData = snapshot.docs.map((doc) => doc.data().Ir);
    res.json(irData);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener datos de IR", error: err });
  }
});

// 📌 5️⃣ GET - Obtener los primeros 50 valores de BPM
app.get("/api/primeros-bpm", async (req, res) => {
  try {
    const snapshot = await db
      .collection("datos_sensores")
      .orderBy("timestamp", "asc")
      .limit(50)
      .get();

    const bpmData = snapshot.docs.map((doc) => doc.data().BPM);
    res.json(bpmData);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener datos de BPM", error: err });
  }
});

// 📌 Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
