const mysql = require("mysql2/promise");
let connection = null; // Variable para mantener la conexión

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};

async function connectToDatabase() {
  // Simplificamos la verificación: si 'connection' ya existe, asumimos que estamos conectados.
  // Cualquier problema con la conexión existente se manifestará al intentar usarla.
  if (connection) {
    // Cambiado de 'connection && connection.connection.state === "authenticated"'
    console.log("Ya conectado a la base de datos.");
    return connection;
  }
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Conexión a la base de datos MySQL establecida exitosamente!");
    return connection;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    throw error;
  }
}

function getConnection() {
  // Simplificamos la verificación: si 'connection' no ha sido asignada, lanzamos el error.
  if (!connection) {
    // Cambiado de '!connection || connection.connection.state !== "authenticated"'
    throw new Error(
      "La conexión a la base de datos no está establecida o está inactiva."
    );
  }
  return connection;
}

module.exports = { connectToDatabase, getConnection };
