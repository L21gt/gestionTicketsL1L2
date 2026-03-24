const authService = require("../../Soporte.Application/Services/authService");

const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const user = await authService.registerUser(
      fullName,
      email,
      password,
      role,
    );
    res.status(201).json({ message: "Usuario registrado exitosamente", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = { register, login };
