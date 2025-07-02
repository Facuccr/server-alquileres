// app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path"); // Importar el módulo 'path' para rutas de archivos

const { connectToDatabase } = require("./config/database.js"); // Importa la función de conexión

const authRoutes = require("./routes/auth.route.js");
const propertyRoutes = require("./routes/property.route.js"); // ¡NUEVO! Importa las rutas de propiedad

const app = express();
const port = process.env.PORT || 3000;

let connection; // Declara la variable de conexión en un ámbito accesible

// Función para inicializar la conexión a la base de datos
async function initializeDatabaseConnection() {
  try {
    connection = await connectToDatabase(); // connectToDatabase ahora devuelve la conexión establecida
  } catch (error) {
    console.error(
      "Error crítico al iniciar la conexión a la base de datos:",
      error.message
    );
    process.exit(1); // Sale de la aplicación si no se puede conectar a la DB
  }
}
initializeDatabaseConnection(); // Llama a la función para iniciar la conexión

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para adjuntar la conexión DB a cada solicitud
// Esto asegura que `req.db` esté disponible en tus controladores
app.use((req, res, next) => {
  if (!connection) {
    return res
      .status(500)
      .json({ message: "La conexión a la base de datos no está establecida." });
  }
  req.db = connection; // Adjunta la conexión activa a la solicitud
  next();
});

// ¡NUEVO! Configura Express para servir archivos estáticos desde la carpeta 'uploads'
// Esto es crucial para que las imágenes/videos subidos sean accesibles desde el frontend
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Rutas de API ---

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Servidor AlkiFor Backend funcionando!");
});

app.use("/api/auth", authRoutes); // Rutas de autenticación (ej: /api/auth/register, /api/auth/login)
app.use("/api", propertyRoutes); // ¡NUEVO! Rutas de propiedades (ej: /api/properties)

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
