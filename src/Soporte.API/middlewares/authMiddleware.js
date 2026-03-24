const jwt = require("jsonwebtoken");

/**
 * Middleware para validar el token y restringir acceso por roles.
 */
const verifyToken = (requiredRoles = []) => {
  return (req, res, next) => {
    // Obtenemos el token del Header de Autorización (Bearer Token)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Acceso denegado. No hay token." });
    }

    try {
      // Verificamos si el token es válido y no ha expirado
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Guardamos los datos del usuario en la petición

      // Si especificamos roles requeridos, verificamos si el usuario tiene el permiso
      if (requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: "No tienes permisos para esta acción." });
      }

      next(); // Si todo está bien, puede continuar
    } catch (error) {
      res.status(403).json({ message: "Token inválido o expirado." });
    }
  };
};

module.exports = { verifyToken };
