const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../../Soporte.Infrastructure/Persistence/db");

/**
 * Servicio encargado de la lógica de autenticación y seguridad de usuarios.
 * Implementa la técnica de Sal y Pimienta para el resguardo de credenciales.
 */

const registerUser = async (fullName, email, password, role) => {
  // Generamos la "Sal" (Salt) única para este usuario
  // El número 10 es el "cost factor", un equilibrio entre seguridad y velocidad
  const salt = await bcrypt.genSalt(10);

  // Aplicamos la "Pimienta" (Pepper) desde las variables de entorno
  // Combinamos la contraseña plana con la pimienta antes de hashear
  const passwordWithPepper = password + process.env.APP_PEPPER;

  // Creamos el Hash final (Password + Pepper) usando la Salt
  const hash = await bcrypt.hash(passwordWithPepper, salt);

  try {
    // Guardamos en la base de datos
    // Guardamos el Hash y la Sal, pero no la pimienta
    const query = `
            INSERT INTO users (full_name, email, password_hash, password_salt, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, email, role;
        `;

    const values = [fullName, email, hash, salt, role];
    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (error) {
    console.error("Error al registrar usuario en la base de datos:", error);
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    // Buscamos al usuario por su email
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    // Si no hay resultados, el correo no existe
    if (result.rows.length === 0) {
      throw new Error("Credenciales incorrectas");
    }

    const user = result.rows[0];

    // Combinamos la contraseña ingresada con la PIMIENTA global
    const passwordWithPepper = password + process.env.APP_PEPPER;

    // Comparamos el hash generado en este momento con el guardado en la DB
    // Bcrypt se encarga de usar la SAL que ya viene dentro del hash guardado
    const isMatch = await bcrypt.compare(
      passwordWithPepper,
      user.password_hash,
    );

    if (!isMatch) {
      throw new Error("Credenciales incorrectas");
    }

    // Creamos el "payload" (la información que viajará en el token)
    const payload = {
      id: user.user_id,
      role: user.role,
    };

    // Firmamos el token con nuestra llave secreta
    // El token expirará en 2 horas por seguridad
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    return {
      fullName: user.full_name,
      role: user.role,
      token: token,
    };
  } catch (error) {
    console.error("Error en el proceso de login:", error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser, //
};
