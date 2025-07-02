// models/property.model.js
class PropertyModel {
  // Método para crear una nueva propiedad en la base de datos
  static async create(db, propertyData) {
    const {
      type,
      price,
      barrio,
      streetType,
      city,
      province,
      zonificacion,
      condition,
      situation,
      antiquity,
      surface,
      coveredSurface,
      urbanization,
      security,
      description,
      ambientes, // Ya viene como string separado por comas desde el controlador
      services, // Ya viene como string separado por comas desde el controlador
      mediaUrls, // Ya viene como JSON string desde el controlador
      userId,
    } = propertyData;

    const query = `
      INSERT INTO Properties (
        type, price, barrio, streetType, city, province, zonificacion,
        \`condition\`, \`situation\`, antiquity, surface, coveredSurface,
        urbanization, security, description, ambientes, services, mediaUrls, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      type,
      price,
      barrio,
      streetType,
      city,
      province,
      zonificacion,
      condition,
      situation,
      antiquity,
      surface,
      coveredSurface,
      urbanization,
      security,
      description,
      ambientes, // Pasa directamente el string
      services, // Pasa directamente el string
      mediaUrls, // Pasa directamente el JSON string
      userId,
    ];

    console.log("--- INTENTANDO INSERTAR EN DB ---");
    console.log("Query:", query);
    console.log("Values:", values);

    try {
      const [result] = await db.execute(query, values);
      console.log("Resultado de la inserción:", result);
      console.log("--- INSERCIÓN EN DB EXITOSA ---");
      return result.insertId; // Devuelve el ID de la propiedad insertada
    } catch (error) {
      console.error("--- ERROR SQL EN PropertyModel.create ---");
      console.error("Error SQL:", error);
      console.error("Error Code:", error.code); // Códigos de error SQL útiles (ej. ER_DUP_ENTRY, ER_NO_DEFAULT_FOR_FIELD)
      console.error("SQL Message:", error.sqlMessage); // Mensaje detallado de MySQL
      throw error; // Vuelve a lanzar el error para que el controlador lo maneje
    }
  }

  // Método para obtener todas las propiedades
  static async findAll(db, filters = {}) {
    let query = `SELECT id, type, price, barrio, streetType, city, province, zonificacion, \`condition\`, \`situation\`, antiquity, surface, coveredSurface, urbanization, security, description, ambientes, services, mediaUrls, userId, createdAt, updatedAt FROM Properties WHERE 1=1`;
    const values = [];

    // Añadir filtros dinámicamente
    if (filters.type) {
      query += ` AND type = ?`;
      values.push(filters.type);
    }
    if (filters.location) {
      query += ` AND city = ?`;
      values.push(filters.location);
    }
    if (filters.priceRange) {
      if (filters.priceRange === "Menos de $500") {
        query += ` AND price < 500`;
      } else if (filters.priceRange === "$500 - $1000") {
        query += ` AND price >= 500 AND price <= 1000`;
      } else if (filters.priceRange === "Más de $1000") {
        query += ` AND price > 1000`;
      }
    }
    if (filters.urbanization) {
      query += ` AND urbanization = ?`;
      values.push(filters.urbanization);
    }
    if (filters.security) {
      query += ` AND security = ?`;
      values.push(filters.security);
    }
    // Para ambientes, el filtro viene como una cadena separada por comas desde el frontend
    // y el controlador lo convierte en un array. Aquí lo usamos para buscar.
    if (
      filters.ambienteFilter &&
      Array.isArray(filters.ambienteFilter) &&
      filters.ambienteFilter.length > 0
    ) {
      filters.ambienteFilter.forEach((ambiente) => {
        // Usamos CONCAT y LIKE para buscar subcadenas si FIND_IN_SET no funciona o para mayor compatibilidad
        // Esto busca si el ambiente está en la cadena "ambientes" (ej. "Cocina,Living")
        query += ` AND ambientes LIKE ?`;
        values.push(`%${ambiente}%`);
      });
    }
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query += ` AND (description LIKE ? OR barrio LIKE ? OR city LIKE ? OR province LIKE ?)`;
      values.push(term, term, term, term);
    }

    try {
      const [rows] = await db.execute(query, values);

      // Post-procesar los resultados para convertir strings a arrays/JSON
      return rows.map((row) => ({
        ...row,
        ambientes: row.ambientes ? row.ambientes.split(",") : [],
        services: row.services ? row.services.split(",") : [],
        mediaUrls: row.mediaUrls ? JSON.parse(row.mediaUrls) : [],
      }));
    } catch (error) {
      console.error("--- ERROR SQL EN PropertyModel.findAll ---");
      console.error("Error SQL:", error);
      console.error("Error Code:", error.code);
      console.error("SQL Message:", error.sqlMessage);
      throw error;
    }
  }

  // Método para obtener una propiedad por ID
  static async findById(db, id) {
    try {
      const [rows] = await db.execute(
        "SELECT id, type, price, barrio, streetType, city, province, zonificacion, `condition`, `situation`, antiquity, surface, coveredSurface, urbanization, security, description, ambientes, services, mediaUrls, userId, createdAt, updatedAt FROM Properties WHERE id = ?",
        [id]
      );
      if (rows.length > 0) {
        const property = rows[0];
        // Post-procesar los resultados
        property.ambientes = property.ambientes
          ? property.ambientes.split(",")
          : [];
        property.services = property.services
          ? property.services.split(",")
          : [];
        property.mediaUrls = property.mediaUrls
          ? JSON.parse(property.mediaUrls)
          : [];
        return property;
      }
      return null;
    } catch (error) {
      console.error("--- ERROR SQL EN PropertyModel.findById ---");
      console.error("Error SQL:", error);
      console.error("Error Code:", error.code);
      console.error("SQL Message:", error.sqlMessage);
      throw error;
    }
  }

  // Nuevo método para actualizar una propiedad
  static async update(db, id, propertyData) {
    // Excluir userId de la actualización si no se desea cambiar
    const updateData = { ...propertyData };
    delete updateData.userId; // No permitir cambiar el userId desde aquí

    // Construir la parte SET de la consulta dinámicamente
    const fields = Object.keys(updateData)
      .map((key) => {
        // `condition` y `situation` necesitan comillas inversas si son columnas
        if (key === "condition" || key === "situation") {
          return `\`${key}\` = ?`;
        }
        return `${key} = ?`;
      })
      .join(", ");
    const values = Object.values(updateData);

    // Añadir el ID al final de los valores para la cláusula WHERE
    values.push(id);

    const query = `UPDATE Properties SET ${fields} WHERE id = ?`;
    console.log("--- INTENTANDO ACTUALIZAR EN DB ---");
    console.log("Query:", query);
    console.log("Values:", values);

    try {
      const [result] = await db.execute(query, values);
      console.log("Resultado de la actualización:", result);
      console.log("--- ACTUALIZACIÓN EN DB EXITOSA ---");
      return result; // result contendrá affectedRows
    } catch (error) {
      console.error("--- ERROR SQL EN PropertyModel.update ---");
      console.error("Error SQL:", error);
      console.error("Error Code:", error.code);
      console.error("SQL Message:", error.sqlMessage);
      throw error;
    }
  }

  // Nuevo método para borrar una propiedad
  static async delete(db, id) {
    const query = `DELETE FROM Properties WHERE id = ?`;
    console.log("--- INTENTANDO ELIMINAR EN DB ---");
    console.log("Query:", query);
    console.log("Values:", [id]);

    try {
      const [result] = await db.execute(query, [id]);
      console.log("Resultado de la eliminación:", result);
      console.log("--- ELIMINACIÓN EN DB EXITOSA ---");
      return result; // result contendrá affectedRows
    } catch (error) {
      console.error("--- ERROR SQL EN PropertyModel.delete ---");
      console.error("Error SQL:", error);
      console.error("Error Code:", error.code);
      console.error("SQL Message:", error.sqlMessage);
      throw error;
    }
  }
}

module.exports = PropertyModel;
