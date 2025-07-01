// app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectToDatabase } = require("./config/database.js");

const authRoutes = require("./routes/auth.route.js");

const app = express();
const port = process.env.PORT || 3000;

connectToDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Rutas de API ---

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Servidor AlkiFor Backend funcionando!");
});

app.use("/api", authRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ message: "Ruta de API no encontrada." });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(
    `Servidor backend de AlkiFor escuchando en http://localhost:${port}`
  );
});
