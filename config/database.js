// config/database.js
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};

async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Conexión a la base de datos MySQL establecida exitosamente!");
    return connection; // Devuelve la conexión
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    throw error; // Propaga el error para que app.js pueda manejarlo
  }
}

module.exports = { connectToDatabase };
