// app.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = require("./config/database");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes y videos subidos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- INICIAMOS EL SERVIDOR DESPUÉS DE CONECTAR LA DB ---
async function startServer() {
  try {
    // 1. Intentamos conectar a la base de datos primero
    await db.connectToDatabase();
    // Si la conexión es exitosa, console.log ya lo maneja desde database.js

    // 2. Ahora que la DB está conectada, configuramos el middleware de DB
    // Este middleware debe ir ANTES de tus rutas que usan req.db
    app.use((req, res, next) => {
      try {
        req.db = db.getConnection(); // Obtiene la conexión activa
        next();
      } catch (error) {
        console.error("Error en middleware de conexión a DB:", error.message);
        return res
          .status(500)
          .json({
            message: "La conexión a la base de datos no está disponible.",
          });
      }
    });

    // Importar rutas (AHORA SÍ, después de que req.db esté disponible)
    const authRoutes = require("./routes/auth.route");
    const propertyRoutes = require("./routes/properties.route");

    // Usar rutas
    app.use("/api/auth", authRoutes);
    app.use("/api/properties", propertyRoutes);

    // Ruta de prueba (ruta raíz del servidor)
    app.get("/", (req, res) => {
      res.send("¡Servidor AlkiFor Backend funcionando!");
    });

    // Manejo de rutas no encontradas (404)
    app.use((req, res) => {
      res.status(404).json({ message: "Ruta de API no encontrada." });
    });

    // 3. Iniciar el servidor Express solo si todo lo anterior fue exitoso
    app.listen(port, () => {
      console.log(
        `Servidor backend de AlkiFor escuchando en http://localhost:${port}`
      );
    });
  } catch (err) {
    // Si hay un error en la conexión a la base de datos, mostramos el error y salimos
    console.error("Error crítico al iniciar el servidor debido a la DB:", err);
    process.exit(1);
  }
}

// Llama a la función para iniciar el servidor
startServer();
