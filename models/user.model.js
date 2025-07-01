// models/user.model.js
const { getDb } = require("../db"); // Importamos la función getDb

class UserModel {
  static async findByEmail(email) {
    const db = getDb(); // Obtenemos la conexión aquí
    const [users] = await db.execute(
      "SELECT id, password_hash, is_verified FROM users WHERE email = ?",
      [email]
    );
    return users.length > 0 ? users[0] : null;
  }

  static async create(fullName, email, phone, passwordHash, userType) {
    const db = getDb(); // Obtenemos la conexión aquí
    const [result] = await db.execute(
      "INSERT INTO users (full_name, email, phone, password_hash, user_type, is_verified) VALUES (?, ?, ?, ?, ?, ?)",
      [fullName, email, phone, passwordHash, userType, false]
    );
    return result.insertId;
  }
}

module.exports = UserModel;
