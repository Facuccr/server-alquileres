// config/database.js
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};

let connection = null;

async function connectToDatabase() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Conexión a la base de datos MySQL establecida exitosamente!");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    process.exit(1); // Salir del proceso si no se puede conectar
  }
}

function getConnection() {
  if (!connection) {
    throw new Error(
      "La conexión a la base de datos no está establecida. Asegúrate de llamar a connectToDatabase primero."
    );
  }
  return connection;
}

module.exports = { connectToDatabase, getConnection };
