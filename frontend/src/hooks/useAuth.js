// Reexportar el hook desde el contexto para evitar duplicidad
// y errores de importación si se cambia la implementación.
export { useAuth } from '../context/AuthContext';