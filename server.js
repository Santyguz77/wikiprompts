import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // Permitir todas las peticiones (desarrollo)
    callback(null, true);
  },
  credentials: true,
  exposedHeaders: ['Set-Cookie'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configurar sesiones
app.use(session({
  secret: 'wikiprompts-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  name: 'wikiprompts.sid',
  cookie: { 
    secure: false,
    httpOnly: false, // Permitir acceso desde JavaScript
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  }
}));

// Servir archivos estáticos
app.use(express.static(__dirname));

// Servir manifest.json
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(join(__dirname, 'manifest.json'));
});

// Servir service worker
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(join(__dirname, 'service-worker.js'));
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("✨ Servidor de Wikiprompts funcionando correctamente");
});

// Conexión con la base de datos SQLite
const db = await open({
  filename: "./lazosdeamor.db",
  driver: sqlite3.Database
});

// Crear tablas si no existen
await db.exec(`
  CREATE TABLE IF NOT EXISTS prompts (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS likes (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS remixes (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS auth_users (
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
`);

// Tablas permitidas
const ALLOWED_TABLES = new Set([
  "prompts",
  "users",
  "comments",
  "likes",
  "remixes",
  "categories",
  "bookmarks"
]);

// ==================== RUTAS DE AUTENTICACIÓN ====================
// IMPORTANTE: Las rutas de autenticación deben ir ANTES de las rutas genéricas
// para evitar que /api/auth/profile sea interpretado como /api/:table/:id

// Función helper para hashear contraseñas
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware para verificar autenticación (sesión o token)
async function requireAuth(req, res, next) {
  // Verificar sesión primero
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Si no hay sesión, verificar header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const userId = authHeader.substring(7);
    try {
      const user = await db.get(
        'SELECT id, email, name, username, avatar, bio, createdAt FROM auth_users WHERE id = ?',
        [userId]
      );
      if (user) {
        req.session.userId = userId;
        req.session.user = user;
        return next();
      }
    } catch (err) {
      console.error('Error verificando token:', err);
    }
  }
  
  return res.status(401).json({ error: "No autenticado" });
}

// Registro de usuario
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, username } = req.body;
  
  if (!email || !password || !name || !username) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  
  try {
    const id = crypto.randomUUID();
    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO auth_users (id, email, password, name, username, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, email, hashedPassword, name, username, now, now]
    );
    
    // Crear sesión
    req.session.userId = id;
    req.session.user = { id, email, name, username };
    
    res.json({ 
      success: true, 
      user: { id, email, name, username, createdAt: now } 
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: "El email o username ya está registrado" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Login de usuario
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }
  
  try {
    const hashedPassword = hashPassword(password);
    const user = await db.get(
      `SELECT id, email, name, username, avatar, bio, createdAt FROM auth_users 
       WHERE email = ? AND password = ?`,
      [email, hashedPassword]
    );
    
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    
    // Crear sesión
    req.session.userId = user.id;
    req.session.user = user;
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login con Google
app.post("/api/auth/google", async (req, res) => {
  const { googleId, email, name, avatar } = req.body;
  
  if (!googleId || !email) {
    return res.status(400).json({ error: "Datos de Google incompletos" });
  }
  
  try {
    // Buscar usuario existente
    let user = await db.get(
      `SELECT id, email, name, username, avatar, bio, createdAt FROM auth_users 
       WHERE googleId = ? OR email = ?`,
      [googleId, email]
    );
    
    if (!user) {
      // Crear nuevo usuario
      const id = crypto.randomUUID();
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
      const now = new Date().toISOString();
      
      await db.run(
        `INSERT INTO auth_users (id, email, name, username, avatar, googleId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, email, name, username, avatar, googleId, now, now]
      );
      
      user = { id, email, name, username, avatar, createdAt: now };
    } else if (!user.googleId) {
      // Actualizar usuario existente con Google ID
      await db.run(
        `UPDATE auth_users SET googleId = ?, avatar = ?, updatedAt = ? WHERE id = ?`,
        [googleId, avatar, new Date().toISOString(), user.id]
      );
      user.avatar = avatar;
    }
    
    // Crear sesión
    req.session.userId = user.id;
    req.session.user = user;
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener usuario actual
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT id, email, name, username, avatar, bio, createdAt FROM auth_users WHERE id = ?`,
      [req.session.userId]
    );
    
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }
    res.json({ success: true });
  });
});

// Actualizar perfil
app.put("/api/auth/profile", requireAuth, async (req, res) => {
  const { name, username, bio, avatar } = req.body;
  
  try {
    const updates = [];
    const params = [];
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (avatar) {
      updates.push('avatar = ?');
      params.push(avatar);
    }
    
    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(req.session.userId);
    
    await db.run(
      `UPDATE auth_users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const user = await db.get(
      `SELECT id, email, name, username, avatar, bio, createdAt FROM auth_users WHERE id = ?`,
      [req.session.userId]
    );
    
    req.session.user = user;
    res.json({ success: true, user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: "El username ya está en uso" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ==================== FIN RUTAS DE AUTENTICACIÓN ====================

// ==================== RUTAS GENÉRICAS PARA DATOS ====================

// Obtener todos los registros
app.get("/api/:table", async (req, res) => {
  const { table } = req.params;
  try {
    if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
    const rows = await db.all(`SELECT * FROM ${table}`);
    res.json(rows.map(r => JSON.parse(r.data)));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Guardar lista completa (reemplaza todo)
app.post("/api/:table", async (req, res) => {
  const { table } = req.params;
  const items = req.body;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  if (!Array.isArray(items)) return res.status(400).json({ error: "Formato inválido" });
  try {
    await db.exec("BEGIN");
    await db.run(`DELETE FROM ${table}`);
    const stmt = await db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
    for (const item of items) {
      await stmt.run(item.id, JSON.stringify(item));
    }
    await stmt.finalize();
    await db.exec("COMMIT");
    res.json({ success: true, count: items.length });
  } catch (err) {
    try { await db.exec("ROLLBACK"); } catch {}
    res.status(500).json({ error: err.message });
  }
});

// Actualizar/crear UN SOLO registro
app.put("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  const item = req.body;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  if (!item || !item.id) return res.status(400).json({ error: "Item inválido" });
  try {
    await db.run(
      `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
      id,
      JSON.stringify(item)
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar UN SOLO registro
app.delete("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  try {
    await db.run(`DELETE FROM ${table} WHERE id = ?`, id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
