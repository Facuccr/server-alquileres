// models/user.model.js
// Ya no importamos 'db' aquí directamente.
// Los métodos del modelo recibirán 'db' como argumento.

class UserModel {
  static async findByEmail(db, email) {
    // Recibe 'db' como primer argumento
    const [users] = await db.execute(
      "SELECT id, password_hash, is_verified FROM users WHERE email = ?",
      [email]
    );
    return users.length > 0 ? users[0] : null;
  }

  static async create(db, fullName, email, phone, passwordHash, userType) {
    // Recibe 'db'
    const [result] = await db.execute(
      "INSERT INTO users (full_name, email, phone, password_hash, user_type, is_verified) VALUES (?, ?, ?, ?, ?, ?)",
      [fullName, email, phone, passwordHash, userType, false]
    );
    return result.insertId;
  }
}

module.exports = UserModel;
