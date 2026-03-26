import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados del Modal
    const [mostrarModal, setMostrarModal] = useState(false);
    const [formularioTicket, setFormularioTicket] = useState({
        product_id: '',
        subject: '',
        description: '',
        type: 'SOPORTE',
        impact: 'BAJO'
    });

    // --- ESTADO PARA LOS PRODUCTOS ---
    const [listaProductos, setListaProductos] = useState([]);

    // Estados para Filtros
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroImpacto, setFiltroImpacto] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Estados para Ordenamiento (Ahora controlados desde los encabezados)
    const [ordenarPor, setOrdenarPor] = useState('created_at');
    const [ordenDireccion, setOrdenDireccion] = useState('desc'); 

    // Estados para Paginación
    const [paginaActivos, setPaginaActivos] = useState(1);
    const [paginaHistorial, setPaginaHistorial] = useState(1);
    const itemsPorPagina = 5;

    // Estado para saber si el PDF se está descargando
    const [descargandoPDF, setDescargandoPDF] = useState(false);

    // --- ESTADOS PARA EL MODAL DE DETALLE Y COMENTARIOS ---
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
    const [detalleTicket, setDetalleTicket] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    // --- FUNCIÓN PARA DESCARGAR EL REPORTE PDF ---
    const handleDescargarReporte = async () => {
        try {
            setDescargandoPDF(true);
            const response = await ticketService.downloadReport();
            
            // Creamos una URL temporal en el navegador con el archivo (Blob) recibido
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Creamos un enlace <a> invisible en el HTML
            const enlace = document.createElement('a');
            enlace.href = url;
            
            // Le asignamos el nombre con el que se va a guardar el archivo
            const fechaHoy = new Date().toISOString().split('T')[0];
            enlace.setAttribute('download', `Reporte_Tickets_${fechaHoy}.pdf`);
            
            // Lo agregamos, le hacemos clic virtualmente y lo borramos
            document.body.appendChild(enlace);
            enlace.click();
            enlace.parentNode.removeChild(enlace);
            window.URL.revokeObjectURL(url); // Limpiamos la memoria
            
        } catch (err) {
            console.error("Error al descargar el PDF:", err);
            alert("Hubo un error al generar el reporte PDF. Revisa la consola.");
        } finally {
            setDescargandoPDF(false);
        }
    };

    const rawRole = localStorage.getItem('role') || '';
    const userRole = rawRole.trim().toUpperCase();

    useEffect(() => {
        cargarTickets();
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            const response = await ticketService.getProducts();
            setListaProductos(response.data);
            
            // Si hay productos, seleccionamos el primero por defecto para que el form no envíe vacío
            if (response.data.length > 0) {
                setFormularioTicket(prev => ({ ...prev, product_id: response.data[0].product_id }));
            }
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    };

    const cargarTickets = async () => {
        try {
            setLoading(true);
            const response = await ticketService.getMyTickets();
            setTickets(response.data); 
            setError(null);
        } catch (err) {
            console.error("Error al cargar los tickets:", err);
            setError("No se pudieron cargar los tickets. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const handleResolve = async (id) => {
        if (!window.confirm("¿Estás seguro de marcar este ticket como Resuelto?")) return;

        try {
            // 1. Dejamos rastro en la bitácora PRIMERO
            await ticketService.postComment(id, { 
                text: "✅ [ACCIÓN DEL SISTEMA]: El ticket ha sido marcado como RESUELTO por el técnico." 
            });
            
            // 2. Ejecutamos la acción real
            await ticketService.resolveTicket(id);
            
            alert("Ticket resuelto con éxito");
            cargarTickets(); 
            setTicketSeleccionado(null); // Cerramos el modal si estaba abierto
        } catch (err) {
            alert("Error al resolver el ticket");
            console.error("Error al resolver el ticket:", err);
        }
    };

    const handleEscalate = async (id) => {
        if (!window.confirm("¿Escalar este ticket al nivel L2?")) return;

        try {
            // 1. Dejamos rastro en la bitácora
            await ticketService.postComment(id, { 
                text: "⚠️ [ACCIÓN DEL SISTEMA]: El ticket ha sido ESCALADO al nivel L2 debido a su complejidad." 
            });
            
            // 2. Ejecutamos la acción real
            await ticketService.escalateTicket(id);
            
            alert("Ticket escalado al nivel L2");
            cargarTickets(); 
            setTicketSeleccionado(null);
        } catch (err) {
            alert("Error al escalar el ticket");
            console.error("Error al escalar el ticket:", err);
        }
    };

    const handleCrearTicket = async (e) => {
    e.preventDefault();

    // Candado de seguridad: Evitar enviar si el asunto está vacío
    if (!formularioTicket.subject.trim()) {
        alert("Por favor, ingresa un asunto para el ticket.");
        return;
    }

    try {
        // El objeto debe tener exactamente estos nombres de propiedad
        const datosParaEnviar = {
            product_id: formularioTicket.product_id,
            assigned_user_id: formularioTicket.assigned_user_id,
            subject: formularioTicket.subject,      
            description: formularioTicket.description,
            type: formularioTicket.type,
            impact: formularioTicket.impact
        };

        await ticketService.createTicket(datosParaEnviar);
        alert("Ticket creado con éxito");
        setMostrarModal(false);
        cargarTickets(); // Recargar la tabla
    } catch (err) {
        console.error("Error al crear:", err);
    }
};

    // --- FUNCIÓN PARA ABRIR DETALLE Y CARGAR COMENTARIOS ---
    const abrirDetalle = async (id) => {
        setTicketSeleccionado(id);
        setCargandoDetalle(true);
        try {
            // Hacemos las dos peticiones al mismo tiempo para que sea más rápido
            const [resTicket, resComentarios] = await Promise.all([
                ticketService.getTicket(id),
                ticketService.getComments(id)
            ]);
            setDetalleTicket(resTicket.data);
            setComentarios(resComentarios.data);
        } catch (err) {
            console.error("Error al cargar detalles:", err);
            alert("Hubo un error al cargar la información del ticket.");
            setTicketSeleccionado(null);
        } finally {
            setCargandoDetalle(false);
        }
    };

    // --- FUNCIÓN PARA ENVIAR UN COMENTARIO ---
    const handleEnviarComentario = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;

        try {
            await ticketService.postComment(ticketSeleccionado, { text: nuevoComentario });
            setNuevoComentario(''); // Limpiamos la caja de texto
            
            // Recargamos solo los comentarios para ver el nuevo al instante
            const resComentarios = await ticketService.getComments(ticketSeleccionado);
            setComentarios(resComentarios.data);
        } catch (err) {
            console.error(err);
            alert("Error al enviar el comentario");
        }
    };

    // --- LÓGICA DE FILTRADO ---
    const ticketsFiltrados = tickets.filter(ticket => {
        const coincideTexto = ticket.subject.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                              ticket.ticket_id.toLowerCase().includes(filtroTexto.toLowerCase());
        const coincideTipo = filtroTipo === '' || ticket.type === filtroTipo;
        const coincideImpacto = filtroImpacto === '' || ticket.impact === filtroImpacto;
        const coincideEstado = filtroEstado === '' || ticket.status === filtroEstado;
        
        return coincideTexto && coincideTipo && coincideImpacto && coincideEstado;
    });

    // --- LÓGICA DE ORDENAMIENTO ---
    const ticketsOrdenados = [...ticketsFiltrados].sort((a, b) => {
        let valorA = a[ordenarPor];
        let valorB = b[ordenarPor];

        if (ordenarPor === 'created_at') {
            valorA = new Date(valorA).getTime();
            valorB = new Date(valorB).getTime();
        } else if (typeof valorA === 'string') {
            valorA = valorA.toLowerCase();
            valorB = valorB.toLowerCase();
        }

        if (valorA < valorB) return ordenDireccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordenDireccion === 'asc' ? 1 : -1;
        return 0;
    });

    // --- FUNCIÓN PARA MANEJAR EL CLIC EN EL ENCABEZADO ---
    const cambiarOrden = (columna) => {
        if (ordenarPor === columna) {
            // Si ya estamos ordenando por esta columna, invertimos la dirección
            setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
        } else {
            // Si es una columna nueva, ordenamos por ella de forma ascendente por defecto
            setOrdenarPor(columna);
            setOrdenDireccion('asc');
        }
        // Reiniciamos la paginación para no perdernos los primeros resultados
        setPaginaActivos(1);
        setPaginaHistorial(1);
    };

    // --- FUNCIÓN PARA MOSTRAR LA FLECHITA CORRECTA ---
    const renderIconoOrden = (columna) => {
        if (ordenarPor !== columna) return <span className="icono-orden">↕</span>;
        return ordenDireccion === 'asc' 
            ? <span className="icono-orden activo">▲</span> 
            : <span className="icono-orden activo">▼</span>;
    };

    // --- SEPARACIÓN DE TABLAS Y PAGINACIÓN ---
    const ticketsActivos = ticketsOrdenados.filter(t => t.status !== 'RESUELTO' && t.status !== 'CERRADO');
    const ticketsHistorial = ticketsOrdenados.filter(t => t.status === 'RESUELTO' || t.status === 'CERRADO');

    const indexFinActivos = paginaActivos * itemsPorPagina;
    const indexInicioActivos = indexFinActivos - itemsPorPagina;
    const activosPaginados = ticketsActivos.slice(indexInicioActivos, indexFinActivos);
    const totalPaginasActivos = Math.ceil(ticketsActivos.length / itemsPorPagina);

    const indexFinHistorial = paginaHistorial * itemsPorPagina;
    const indexInicioHistorial = indexFinHistorial - itemsPorPagina;
    const historialPaginado = ticketsHistorial.slice(indexInicioHistorial, indexFinHistorial);
    const totalPaginasHistorial = Math.ceil(ticketsHistorial.length / itemsPorPagina);

    const manejarCambioFiltro = () => {
        setPaginaActivos(1);
        setPaginaHistorial(1);
    };

    const renderTabla = (listaTickets) => {
        if (listaTickets.length === 0) return <p>No se encontraron tickets con estos criterios.</p>;

        return (
            <div className="contenedor-tabla">
                <table className="tabla-tickets">
                    <thead>
                        <tr>
                            <th className="th-ordenable" onClick={() => cambiarOrden('ticket_id')}>
                                <div className="contenedor-th">ID {renderIconoOrden('ticket_id')}</div>
                            </th>
                            <th className="th-ordenable" onClick={() => cambiarOrden('subject')}>
                                <div className="contenedor-th">Asunto {renderIconoOrden('subject')}</div>
                            </th>
                            <th className="th-ordenable" onClick={() => cambiarOrden('type')}>
                                <div className="contenedor-th">Tipo {renderIconoOrden('type')}</div>
                            </th>
                            <th className="th-ordenable" onClick={() => cambiarOrden('impact')}>
                                <div className="contenedor-th">Impacto {renderIconoOrden('impact')}</div>
                            </th>
                            <th className="th-ordenable" onClick={() => cambiarOrden('status')}>
                                <div className="contenedor-th">Estado {renderIconoOrden('status')}</div>
                            </th>
                            <th className="th-ordenable" onClick={() => cambiarOrden('current_level')}>
                                <div className="contenedor-th">Nivel {renderIconoOrden('current_level')}</div>
                            </th>
                            <th className="th-ordenable" onClick={() => cambiarOrden('created_at')}>
                                <div className="contenedor-th">Fecha {renderIconoOrden('created_at')}</div>
                            </th>
                            {/* La columna de acciones no es ordenable */}
                            <th>
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {listaTickets.map((ticket) => (
                            <tr key={ticket.ticket_id}>
                                <td className="celda-id" title={ticket.ticket_id}>
                                    {ticket.ticket_id}
                                </td>
                                <td>{ticket.subject}</td>
                                <td>{ticket.type}</td>
                                <td>{ticket.impact}</td>
                                <td>
                                    <span className={`etiqueta-estado estado-${ticket.status.toLowerCase()}`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td>L{ticket.current_level}</td>
                                <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                <td className="td-acciones">
                                    {/* Botón Detalles: Siempre visible */}
                                    <button 
                                        className="btn-detalle"
                                        onClick={() => abrirDetalle(ticket.ticket_id)}
                                    >
                                        Detalles
                                    </button>

                                    {/* Botones Resolver y Escalar: Ocultos si ya está cerrado/resuelto */}
                                    {ticket.status !== 'CERRADO' && ticket.status !== 'RESUELTO' && (
                                        <>
                                            <button 
                                                className="btn-resolver"
                                                onClick={() => handleResolve(ticket.ticket_id)}
                                            >
                                                Resolver
                                            </button>
                                            
                                            {userRole === 'L1' && ticket.current_level === 1 && (
                                                <button 
                                                    className="btn-escalar"
                                                    onClick={() => handleEscalate(ticket.ticket_id)}
                                                >
                                                    Escalar
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            <header className="top-navbar">
                <h1>Panel de Gestión de Tickets - Nivel {userRole}</h1>
                <div className="header-actions">
                    {/* Botón de PDF visible para L1 y L2 */}
                    <button 
                        className="btn-descargar" 
                        onClick={handleDescargarReporte}
                        disabled={descargandoPDF}
                    >
                        {descargandoPDF ? 'Generando PDF...' : '📄 Descargar Reporte'}
                    </button>

                    {/* Botón Nuevo Ticket (Solo L1) */}
                    {userRole === 'L1' && (
                        <button className="btn-guardar" onClick={() => setMostrarModal(true)}>
                            + Nuevo Ticket
                        </button>
                    )}
                    
                    <button onClick={handleLogout} className="btn-cancelar" style={{marginLeft: '10px'}}>
                        Cerrar Sesión
                    </button>
                </div>
            </header>
            
            <main className="main-content">
                
                {/* --- SECCIÓN DE FILTROS (Más limpia, sin los botones de ordenamiento) --- */}
                <div className="seccion-controles">
                    <div className="fila-controles">
                        <span className="etiqueta-control">Filtrar por:</span>
                        <input 
                            type="text" 
                            className="input-filtro" 
                            placeholder="Buscar asunto o ID..." 
                            value={filtroTexto}
                            onChange={(e) => { setFiltroTexto(e.target.value); manejarCambioFiltro(); }}
                        />
                        <select 
                            className="select-filtro"
                            value={filtroTipo}
                            onChange={(e) => { setFiltroTipo(e.target.value); manejarCambioFiltro(); }}
                        >
                            <option value="">Todos los Tipos</option>
                            <option value="SOPORTE">Soporte</option>
                            <option value="FALLA">Falla</option>
                            <option value="SOLICITUD">Solicitud</option>
                        </select>

                        <select 
                            className="select-filtro"
                            value={filtroImpacto}
                            onChange={(e) => { setFiltroImpacto(e.target.value); manejarCambioFiltro(); }}
                        >
                            <option value="">Cualquier Impacto</option>
                            <option value="BAJO">Bajo</option>
                            <option value="MEDIO">Medio</option>
                            <option value="ALTO">Alto</option>
                            <option value="CRITICO">Crítico</option>
                        </select>

                        <select 
                            className="select-filtro"
                            value={filtroEstado}
                            onChange={(e) => { setFiltroEstado(e.target.value); manejarCambioFiltro(); }}
                        >
                            <option value="">Cualquier Estado</option>
                            <option value="ABIERTO">Abierto</option>
                            <option value="EN_PROCESO">En Proceso</option>
                            <option value="ESCALADO">Escalado</option>
                        </select>
                    </div>
                </div>

                {loading && <p>Cargando información del servidor...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && (
                    <>
                        <div className="seccion-tabla">
                            <h3>Tickets Activos</h3>
                            {renderTabla(activosPaginados)}
                            
                            {totalPaginasActivos > 1 && (
                                <div className="controles-paginacion">
                                    <button 
                                        className="btn-pagina" 
                                        disabled={paginaActivos === 1}
                                        onClick={() => setPaginaActivos(paginaActivos - 1)}
                                    >
                                        Anterior
                                    </button>
                                    <span className="texto-paginacion">
                                        Página {paginaActivos} de {totalPaginasActivos}
                                    </span>
                                    <button 
                                        className="btn-pagina" 
                                        disabled={paginaActivos === totalPaginasActivos}
                                        onClick={() => setPaginaActivos(paginaActivos + 1)}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="seccion-tabla">
                            <h3>Historial de Tickets (Resueltos / Cerrados)</h3>
                            {renderTabla(historialPaginado)}

                            {totalPaginasHistorial > 1 && (
                                <div className="controles-paginacion">
                                    <button 
                                        className="btn-pagina" 
                                        disabled={paginaHistorial === 1}
                                        onClick={() => setPaginaHistorial(paginaHistorial - 1)}
                                    >
                                        Anterior
                                    </button>
                                    <span className="texto-paginacion">
                                        Página {paginaHistorial} de {totalPaginasHistorial}
                                    </span>
                                    <button 
                                        className="btn-pagina" 
                                        disabled={paginaHistorial === totalPaginasHistorial}
                                        onClick={() => setPaginaHistorial(paginaHistorial + 1)}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* --- MODAL DE CREACIÓN DE TICKET --- */}
            {mostrarModal && (
                <div className="fondo-modal">
                    <div className="contenido-modal">
                        <h3>Crear Nuevo Ticket</h3>
                        <form onSubmit={handleCrearTicket}>
                            <div className="grupo-formulario">
                                <label>Producto / Sistema afectado:</label>
                                <select 
                                    required
                                    value={formularioTicket.product_id}
                                    onChange={(e) => setFormularioTicket({...formularioTicket, product_id: e.target.value})}
                                >
                                    <option value="" disabled>Seleccione un producto...</option>
                                    {listaProductos.map(prod => (
                                        <option key={prod.product_id} value={prod.product_id}>
                                            {prod.product_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grupo-formulario">
                                <label>Asunto:</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formularioTicket.subject} 
                                    onChange={(e) => setFormularioTicket({...formularioTicket, subject: e.target.value})}
                                    placeholder="Ej. Falla en el sistema"
                                />
                            </div>
                            <div className="grupo-formulario">
                                <label>Descripción detallada:</label>
                                <textarea 
                                    required
                                    rows="3"
                                    placeholder="Describe el problema a detalle..."
                                    value={formularioTicket.description}
                                    onChange={(e) => setFormularioTicket({...formularioTicket, description: e.target.value})}
                                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                                />
                            </div>
                            <div className="grupo-formulario">
                                <label>Tipo de Ticket:</label>
                                <select 
                                    value={formularioTicket.type}
                                    onChange={(e) => setFormularioTicket({...formularioTicket, type: e.target.value})}
                                >
                                    <option value="SOPORTE">Soporte General</option>
                                    <option value="FALLA">Reporte de Falla</option>
                                    <option value="SOLICITUD">Nueva Solicitud</option>
                                </select>
                            </div>
                            <div className="grupo-formulario">
                                <label>Nivel de Impacto:</label>
                                <select 
                                    value={formularioTicket.impact}
                                    onChange={(e) => setFormularioTicket({...formularioTicket, impact: e.target.value})}
                                >
                                    <option value="BAJO">Bajo</option>
                                    <option value="MEDIO">Medio</option>
                                    <option value="ALTO">Alto</option>
                                    <option value="CRITICO">Crítico (Sistema caído)</option>
                                </select>
                            </div>
                            <div className="acciones-modal">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar">
                                    Crear Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE DETALLES Y COMENTARIOS --- */}
            {ticketSeleccionado && (
                <div className="fondo-modal">
                    <div className="contenido-modal modal-ancho">
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h3>Detalle del Ticket</h3>
                            <button className="btn-cancelar" onClick={() => setTicketSeleccionado(null)}>X Cerrar</button>
                        </div>

                        {cargandoDetalle ? (
                            <p>Cargando información completa...</p>
                        ) : detalleTicket ? (
                            <div className="cuerpo-detalle">
                                
                                {/* Columna Izquierda: Información */}
                                <div className="panel-info">
                                    <p><strong>ID:</strong> <span className="celda-id">{detalleTicket.ticket_id}</span></p>
                                    <p><strong>Técnico Asignado:</strong> {detalleTicket.assigned_user || 'Sin asignar'}</p>
                                    <p><strong>Asunto:</strong> {detalleTicket.subject}</p>
                                    <p><strong>Estado:</strong> <span className={`etiqueta-estado estado-${detalleTicket.status.toLowerCase()}`}>{detalleTicket.status}</span></p>
                                    <p><strong>Nivel Actual:</strong> L{detalleTicket.current_level}</p>
                                    <p><strong>Impacto:</strong> {detalleTicket.impact} | <strong>Tipo:</strong> {detalleTicket.type}</p>
                                    <p><strong>Fecha de Creación:</strong> {new Date(detalleTicket.created_at).toLocaleString()}</p>
                                    
                                    <hr style={{margin: '15px 0', borderColor: '#eee'}} />
                                    
                                    <p><strong>Descripción original del problema:</strong></p>
                                    <div style={{backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>
                                        {detalleTicket.description || "Sin descripción detallada."}
                                    </div>
                                </div>

                                {/* Columna Derecha: Comentarios / Bitácora */}
                                <div className="panel-comentarios">
                                    <h4>Bitácora de Seguimiento</h4>
                                    
                                    <div className="lista-comentarios">
                                        {comentarios.length === 0 ? (
                                            <p style={{color: '#888', textAlign: 'center'}}>No hay comentarios en este ticket.</p>
                                        ) : (
                                            comentarios.map(comentario => (
                                                <div key={comentario.comment_id} className="burbuja-comentario">
                                                    <div className="meta-comentario">
                                                        {comentario.user_name || 'Usuario'} - {new Date(comentario.created_at).toLocaleString()}
                                                    </div>
                                                    <div className="texto-comentario">
                                                        {comentario.content}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Solo permitir comentar si el ticket NO está cerrado */}
                                    {detalleTicket.status !== 'CERRADO' ? (
                                        <form className="formulario-comentario" onSubmit={handleEnviarComentario}>
                                            <textarea 
                                                rows="3" 
                                                placeholder="Escribe una actualización o comentario..."
                                                value={nuevoComentario}
                                                onChange={(e) => setNuevoComentario(e.target.value)}
                                                required
                                            />
                                            <button type="submit" className="btn-guardar" style={{alignSelf: 'flex-end'}}>
                                                Agregar Comentario
                                            </button>
                                        </form>
                                    ) : (
                                        <div style={{backgroundColor: '#e2e3e5', padding: '10px', borderRadius: '4px', textAlign: 'center'}}>
                                            Este ticket está cerrado. No se admiten más comentarios.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p>No se encontró la información del ticket.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;