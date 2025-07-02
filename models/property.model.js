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
      ambientes,
      services,
      mediaUrls,
      userId,
    } = propertyData;

    const query = `
      INSERT INTO Properties (
        type, price, barrio, streetType, city, province, zonificacion,
        \`condition\`, \`situation\`, antiquity, surface, coveredSurface, -- ¡CORREGIDO!
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
      coveredSurface, // Aquí no llevan comillas porque son variables JS
      urbanization,
      security,
      description,
      ambientes.join(","),
      services.join(","),
      JSON.stringify(mediaUrls),
      userId,
    ];

    const [result] = await db.execute(query, values);
    return result.insertId;
  }

  // Método para obtener todas las propiedades
  static async findAll(db, filters = {}) {
    // Asegúrate de que las columnas problemáticas también se seleccionen con comillas inversas si es necesario,
    // aunque SELECT * generalmente maneja esto si la tabla fue creada correctamente.
    // Sin embargo, si alguna consulta específica las usa, también comillarlas.
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
    if (filters.ambientes && filters.ambientes.length > 0) {
      filters.ambientes.forEach((ambiente) => {
        query += ` AND FIND_IN_SET(?, ambientes)`;
        values.push(ambiente);
      });
    }
    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query += ` AND (description LIKE ? OR barrio LIKE ? OR city LIKE ? OR province LIKE ?)`;
      values.push(term, term, term, term);
    }

    const [rows] = await db.execute(query, values);

    // Post-procesar los resultados para convertir strings a arrays/JSON
    return rows.map((row) => ({
      ...row,
      ambientes: row.ambientes ? row.ambientes.split(",") : [],
      services: row.services ? row.services.split(",") : [],
      mediaUrls: row.mediaUrls ? JSON.parse(row.mediaUrls) : [],
    }));
  }

  // Método para obtener una propiedad por ID
  static async findById(db, id) {
    // Aquí también se debería usar `condition` y `situation` con comillas si se seleccionan explícitamente
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
      property.services = property.services ? property.services.split(",") : [];
      property.mediaUrls = property.mediaUrls
        ? JSON.parse(property.mediaUrls)
        : [];
      return property;
    }
    return null;
  }
}

module.exports = PropertyModel;
