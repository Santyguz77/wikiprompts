# Sistema de Autenticación - Wikiprompts

## ✅ Implementado

### Backend (server.js)
- ✅ Tabla `auth_users` en SQLite
- ✅ Rutas de autenticación:
  - `POST /api/auth/register` - Registro de usuarios
  - `POST /api/auth/login` - Inicio de sesión
  - `POST /api/auth/google` - Login con Google
  - `GET /api/auth/me` - Obtener usuario actual
  - `POST /api/auth/logout` - Cerrar sesión
  - `PUT /api/auth/profile` - Actualizar perfil
- ✅ Sesiones con express-session
- ✅ Hash de contraseñas con SHA-256

### Frontend
- ✅ Página de autenticación (`auth.html`)
- ✅ Formularios de login y registro
- ✅ Integración con Google Sign In (estructura lista)
- ✅ Actualización de `profile.html` para cargar datos reales
- ✅ Estado de autenticación en `app.js`
- ✅ Botón de login/perfil en header

## 🚀 Instalación

1. Instalar la nueva dependencia:
```bash
npm install express-session
```

2. Reiniciar el servidor:
```bash
npm start
```

## 📱 Uso

### Registro
1. Ir a `auth.html`
2. Click en "Regístrate"
3. Llenar formulario (nombre, username, email, contraseña)
4. Click en "Crear Cuenta"

### Login
1. Ir a `auth.html`
2. Ingresar email y contraseña
3. Click en "Iniciar Sesión"

### Perfil
1. Una vez autenticado, click en el botón de perfil
2. Ver datos personales y prompts
3. Click en "Editar Perfil" (próximamente)
4. Click en "Cerrar Sesión" para salir

## 🔐 Google OAuth (Configuración)

Para habilitar completamente Google Sign In:

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto "Wikiprompts"
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Agregar origen autorizado: `http://localhost:3000`
6. Copiar Client ID
7. En `auth.html`, descomentar el código de Google y agregar tu Client ID
8. Actualizar el endpoint en server.js para validar token de Google

## 📊 Base de Datos

Tabla `auth_users`:
```sql
CREATE TABLE auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  username TEXT UNIQUE,
  avatar TEXT,
  bio TEXT,
  googleId TEXT UNIQUE,
  createdAt TEXT,
  updatedAt TEXT
);
```

## 🔄 Flujo de Autenticación

1. Usuario entra a cualquier página
2. `app.js` verifica `localStorage.currentUser`
3. Si no hay usuario, muestra botón "Iniciar Sesión"
4. Usuario hace login/registro en `auth.html`
5. Servidor crea sesión y retorna datos del usuario
6. Frontend guarda en `localStorage`
7. Redirect a `index.html`
8. UI se actualiza con datos del usuario

## 🛡️ Seguridad

- Contraseñas hasheadas con SHA-256
- Sesiones HTTP-only cookies
- Validación de datos en backend
- CORS configurado
- Tokens de sesión de 7 días

## 📝 Próximos pasos

- [ ] Modal de edición de perfil
- [ ] Subir avatar personalizado
- [ ] Validación de email
- [ ] Recuperación de contraseña
- [ ] Integración completa de Google OAuth
- [ ] Rate limiting en endpoints de auth
- [ ] 2FA opcional
