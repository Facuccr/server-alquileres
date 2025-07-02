// db.js
const { getConnection } = require("./config/database.js");

// Exportamos la función getConnection directamente
module.exports = {
  getDb: () => {
    try {
      return getConnection();
    } catch (error) {
      console.error(
        "Error al obtener la conexión de la base de datos en db.js:",
        error.message
      );
      throw error;
    }
  },
};
