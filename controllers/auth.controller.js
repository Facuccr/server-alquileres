// controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const UserModel = require("../models/user.model.js");

const authController = {
  register: async (req, res) => {
    const { full_name, email, phone, password, user_type } = req.body;

    // Validaciones de entrada (moved from server.js)
    if (!full_name || !email || !password || !user_type) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos." });
    }
    if (!email.includes("@") || !email.includes(".")) {
      return res
        .status(400)
        .json({ message: "Formato de correo electrónico inválido." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 8 caracteres." });
    }

    try {
      // Verifica si el email ya existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "Este correo electrónico ya está registrado." });
      }

      // Hashea la contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const userId = await UserModel.create(
        full_name,
        email,
        phone,
        password_hash,
        user_type
      );

      res.status(201).json({
        message:
          "Registro exitoso. Procede a verificar tu cuenta en el navegador.",
        userId: userId,
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res.status(500).json({
        message: "Error interno del servidor al registrar el usuario.",
        error: error.message,
      });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    // Validaciones de entrada (moved from server.js)
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Correo electrónico y contraseña son requeridos." });
    }

    try {
      // Busca el usuario
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas." });
      }

      // Compara la contraseña
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciales inválidas." });
      }

      // Autenticación exitosa
      res.status(200).json({
        message: "Inicio de sesión exitoso.",
        userId: user.id,
      });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      res.status(500).json({
        message: "Error interno del servidor al iniciar sesión.",
        error: error.message,
      });
    }
  },
};

module.exports = authController;
