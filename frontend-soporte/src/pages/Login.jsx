import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Maneja el envío del formulario de autenticación
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token); // Guardamos el token JWT en localStorage
            localStorage.setItem('role', response.data.role); // Guardamos el rol del usuario para mostrar la interfaz adecuada

            // Redirección al Dashboard
            navigate('/dashboard');
        } catch (err) {
            // Captura errores del backend (ej. 401 Unauthorized)
            setError(err.response?.data?.error || 'Error validando credenciales');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <h2 className="login-title">Acceso al Sistema</h2>
                
                {error && <div className="alert-error">{error}</div>}
                
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="emailInput">Correo Electrónico</label>
                        <input
                            id="emailInput"
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="passwordInput">Contraseña</label>
                        <input
                            id="passwordInput"
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn-primary">
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;