// Configuración de la API
const API_URL = 'https://sentences-col-vice-antivirus.trycloudflare.com/api';

// Estado global de la aplicación
const AppState = {
    prompts: [],
    users: [],
    comments: [],
    likes: [],
    categories: [],
    currentUser: null,
    currentCategory: 'all',
    searchQuery: ''
};

// Verificar autenticación al cargar
async function checkAuth() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        AppState.currentUser = JSON.parse(storedUser);
        return true;
    }
    return false;
}

// Función para requerir autenticación
function requireAuth() {
    if (!AppState.currentUser) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Función para cerrar sesión
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
    localStorage.removeItem('currentUser');
    AppState.currentUser = null;
    window.location.href = 'auth.html';
}

// Utilidades para LocalStorage
const Storage = {
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

// Cliente API
const API = {
    async getAll(table) {
        try {
            const response = await fetch(`${API_URL}/${table}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error obteniendo ${table}:`, error);
            return [];
        }
    },
    
    async save(table, items) {
        try {
            const response = await fetch(`${API_URL}/${table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error guardando ${table}:`, error);
            throw error;
        }
    },
    
    async update(table, id, item) {
        try {
            const response = await fetch(`${API_URL}/${table}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error actualizando ${table}:`, error);
            throw error;
        }
    }
};

// Utilidades generales
const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    formatDate(date) {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    },
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// Datos de ejemplo para la demostración
const samplePrompts = [
    {
        id: 'prompt-1',
        title: 'Neo-Tokyo',
        category: 'visuals',
        type: 'image',
        model: 'MJ v5',
        prompt: 'A futuristic cyberpunk city at night, neon lights reflecting on wet streets, rain, dramatic lighting --ar 16:9 --v 5',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGy8KzzzYhhbIReoYQqGLw4bqJVTHEg2WGC_CHAuaehAV9u95O9W6UoDxHbAGPPSv6fV10hYUccrFUWmrVdIlBYfdyrrjNAcGtcPSgIL-8m2WzbqGDBKSlJ7IjDHwxEb8u9YyybSHH_BCSp94WOpIC8Wh1Z45-6PoQzvX7TnzpysoHtvjm_3BYBb6_umrHNQbCPss_oQAlvJEfqcVhC-qMXfqk5gKJpLgApHLlXGAbtSIRt8L0O3tVSKuuhZ4IrdbTY4-gUwxhZLUh',
        likes: 2400,
        author: 'User1',
        createdAt: new Date('2024-01-15').toISOString()
    },
    {
        id: 'prompt-2',
        title: 'SEO Master',
        category: 'marketing',
        type: 'text',
        model: 'GPT-4',
        prompt: 'Act as an SEO expert. Write a comprehensive guide on modern link building strategies focusing on quality over quantity...',
        likes: 1850,
        author: 'User2',
        createdAt: new Date('2024-01-14').toISOString()
    },
    {
        id: 'prompt-3',
        title: 'Fluid Abstract',
        category: 'visuals',
        type: 'image',
        model: 'SDXL',
        prompt: 'Abstract fluid art, organic shapes, pastel colors, dreamy atmosphere, high resolution --ar 3:4',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0WUQ2s2klMUngXNSpPd6VfN9tCb_yTJyVyRRXuHkBVDvpbDeQJSScStW8N1hZpxCW7tiT3-dZIlYMz3eQ5EDL0QznrCvfZnPAYYIsJSPGvc27tmBLY92MVqEuQUOyUuP5atCg6R0Frv1uXemieAR6u6KF0dsmpRHTAffyhxOKg8P6J_AFBsUccdslGlurw1pLZTRK35kFUbxePcYADYAGUeVnuFylI89ukldKQsBLU_u5vBbwyudNeEk4GjjxHIzg91sIVCNvjLUq',
        likes: 1620,
        author: 'User3',
        createdAt: new Date('2024-01-13').toISOString()
    },
    {
        id: 'prompt-4',
        title: 'Data Scraper',
        category: 'coding',
        type: 'code',
        model: 'Python',
        prompt: 'Create a Python script to scrape product data from e-commerce websites using Beautiful Soup and Selenium',
        codePreview: 'def scrape(url):\n  res = get(url)\n  return res.text',
        likes: 980,
        author: 'User4',
        createdAt: new Date('2024-01-12').toISOString()
    },
    {
        id: 'prompt-5',
        title: 'Minimal Arch',
        category: 'visuals',
        type: 'image',
        model: 'MJ v5',
        prompt: 'Minimalist architecture, white walls, natural light, clean lines, modern interior design --ar 4:5',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcLwf2D8zb3GT0X5d4r6s8Ttzhez9UoqjqsKPe0QzDNr-rxJG4aY_PEsCk-btxsp5DYpnL0QUDnmGYeFbh8b0dM6KHlB-97Y9H4cqSCsnVCnZL2TUkoIt6QRzphLw3JOcIxglI_aYgyiAkoYKMZ5EDCjulWWUNrnPIxGpagGkIggTWzUiSLpr3Ce6ec5Co8gnH-0fB1PLxuLvAaqbkzMNd_8a5We2fB9Iwzo86mYNQU5vU6cM_tn5InjDxtE2D_BQSjCX_b7lU-6Kr',
        likes: 1340,
        author: 'User5',
        createdAt: new Date('2024-01-11').toISOString()
    },
    {
        id: 'prompt-6',
        title: 'Blog Post Writer',
        category: 'writing',
        type: 'text',
        model: 'Claude',
        prompt: 'Write a comprehensive 2000-word blog post about sustainable living practices. Include statistics, practical tips, and engaging storytelling.',
        likes: 756,
        author: 'User6',
        createdAt: new Date('2024-01-10').toISOString()
    }
];

// Inicializar la aplicación
async function init() {
    // Verificar autenticación
    await checkAuth();
    
    try {
        console.log('🔄 Cargando datos del servidor...');
        
        // Cargar datos del servidor
        const [prompts, categories, likes, bookmarks] = await Promise.all([
            API.getAll('prompts'),
            API.getAll('categories'),
            API.getAll('likes'),
            API.getAll('bookmarks')
        ]);
        
        console.log(`✅ Cargados ${prompts.length} prompts del servidor`);
        
        // Si no hay datos en el servidor, usar datos de ejemplo
        if (prompts.length === 0) {
            console.log('📝 Inicializando datos de ejemplo en el servidor...');
            AppState.prompts = samplePrompts;
            await API.save('prompts', samplePrompts);
            console.log('✅ Datos de ejemplo guardados en el servidor');
        } else {
            AppState.prompts = prompts;
        }
        
        AppState.categories = categories;
        AppState.likes = likes;
        
    } catch (error) {
        console.error('❌ Error conectando con el servidor:', error);
        alert('No se pudo conectar con el servidor. Por favor verifica que esté en ejecución.');
        AppState.prompts = [];
    }
    
    // Actualizar UI con usuario actual
    updateUserUI();
    
    // Renderizar prompts
    renderPrompts();
    
    // Configurar event listeners
    setupEventListeners();
}

// Actualizar UI con información del usuario
function updateUserUI() {
    const profileBtn = document.getElementById('profileBtn');
    const loginBtn = document.getElementById('loginBtn');
    
    if (AppState.currentUser) {
        // Usuario autenticado
        if (profileBtn) {
            profileBtn.classList.remove('hidden');
            const avatarContainer = profileBtn.querySelector('div');
            if (AppState.currentUser.avatar) {
                avatarContainer.innerHTML = `<img src="${AppState.currentUser.avatar}" class="w-full h-full object-cover" alt="${AppState.currentUser.name}">`;
            }
        }
        if (loginBtn) {
            loginBtn.classList.add('hidden');
        }
    } else {
        // Usuario no autenticado
        if (profileBtn) {
            profileBtn.classList.add('hidden');
        }
        if (loginBtn) {
            loginBtn.classList.remove('hidden');
            loginBtn.addEventListener('click', () => {
                window.location.href = 'auth.html';
            });
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.toLowerCase();
            renderPrompts();
        });
    }
    
    // Filtros de categoría
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos
            categoryButtons.forEach(b => b.classList.remove('active', 'bg-black', 'text-white'));
            categoryButtons.forEach(b => b.classList.add('bg-white', 'text-gray-500'));
            
            // Agregar clase active al botón clickeado
            btn.classList.remove('bg-white', 'text-gray-500');
            btn.classList.add('active', 'bg-black', 'text-white');
            
            // Actualizar categoría actual
            AppState.currentCategory = btn.dataset.category;
            renderPrompts();
        });
    });
    
    // Botón de agregar prompt
    const addPromptBtn = document.getElementById('addPromptBtn');
    if (addPromptBtn) {
        addPromptBtn.addEventListener('click', () => {
            window.location.href = 'contribute.html';
        });
    }
    
    // Navegación inferior
    const navHome = document.getElementById('navHome');
    const navExplore = document.getElementById('navExplore');
    const navBookmarks = document.getElementById('navBookmarks');
    const navProfile = document.getElementById('navProfile');
    const profileBtn = document.getElementById('profileBtn');
    
    // Desktop navigation buttons
    const navHomeDesktop = document.getElementById('navHomeDesktop');
    const navExploreDesktop = document.getElementById('navExploreDesktop');
    const navBookmarksDesktop = document.getElementById('navBookmarksDesktop');
    
    // Mobile navigation
    if (navHome) {
        navHome.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (navExplore) {
        navExplore.addEventListener('click', () => {
            window.location.href = 'explore.html';
        });
    }
    
    if (navBookmarks) {
        navBookmarks.addEventListener('click', () => {
            window.location.href = 'bookmarks.html';
        });
    }
    
    if (navProfile) {
        navProfile.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
    
    // Desktop navigation
    if (navHomeDesktop) {
        navHomeDesktop.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (navExploreDesktop) {
        navExploreDesktop.addEventListener('click', () => {
            window.location.href = 'explore.html';
        });
    }
    
    if (navBookmarksDesktop) {
        navBookmarksDesktop.addEventListener('click', () => {
            window.location.href = 'bookmarks.html';
        });
    }
    
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
}

// Renderizar prompts
function renderPrompts() {
    const grid = document.getElementById('promptsGrid');
    if (!grid) return;
    
    // Filtrar prompts
    let filteredPrompts = AppState.prompts;
    
    // Filtrar por categoría
    if (AppState.currentCategory !== 'all') {
        filteredPrompts = filteredPrompts.filter(p => p.category === AppState.currentCategory);
    }
    
    // Filtrar por búsqueda
    if (AppState.searchQuery) {
        filteredPrompts = filteredPrompts.filter(p => 
            p.title.toLowerCase().includes(AppState.searchQuery) ||
            p.prompt.toLowerCase().includes(AppState.searchQuery) ||
            p.category.toLowerCase().includes(AppState.searchQuery)
        );
    }
    
    // Renderizar
    grid.innerHTML = filteredPrompts.map(prompt => createPromptCard(prompt)).join('') + createAddCard();
}

// Crear tarjeta de prompt
function createPromptCard(prompt) {
    if (prompt.type === 'image') {
        return `
            <article class="group flex flex-col gap-3 cursor-pointer" onclick="viewPrompt('${prompt.id}')">
                <div class="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 ring-1 ring-black/5">
                    <img alt="${prompt.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${prompt.imageUrl}"/>
                    <div class="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm">
                        <span class="text-[9px] font-bold uppercase tracking-wider text-black">${prompt.model}</span>
                    </div>
                </div>
                <div class="flex flex-col gap-0.5 px-1">
                    <h3 class="font-display font-semibold text-[15px] leading-tight text-primary group-hover:text-gray-600 transition-colors">${prompt.title}</h3>
                    <div class="flex items-center justify-between mt-1">
                        <p class="text-[11px] font-medium text-gray-400">${getCategoryLabel(prompt.category)}</p>
                        <button class="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-[16px] text-black">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    } else if (prompt.type === 'text') {
        return `
            <article class="group flex flex-col gap-3 cursor-pointer" onclick="viewPrompt('${prompt.id}')">
                <div class="relative aspect-[3/4] rounded-2xl bg-white border border-gray-100 p-5 flex flex-col justify-between hover:shadow-subtle hover:border-gray-200 transition-all duration-300">
                    <div class="flex justify-between items-start">
                        <div class="w-2 h-2 rounded-full bg-black"></div>
                    </div>
                    <p class="font-body text-[11px] leading-relaxed text-gray-500 line-clamp-6">
                        <span class="font-semibold text-black">Prompt:</span> ${Utils.truncateText(prompt.prompt, 150)}
                    </p>
                    <div class="bg-gray-50 px-2 py-1 rounded-md self-start border border-gray-100">
                        <span class="text-[9px] font-bold uppercase tracking-wider text-gray-400">${prompt.model}</span>
                    </div>
                </div>
                <div class="flex flex-col gap-0.5 px-1">
                    <h3 class="font-display font-semibold text-[15px] leading-tight text-primary group-hover:text-gray-600 transition-colors">${prompt.title}</h3>
                    <p class="text-[11px] font-medium text-gray-400">${getCategoryLabel(prompt.category)}</p>
                </div>
            </article>
        `;
    } else if (prompt.type === 'code') {
        return `
            <article class="group flex flex-col gap-3 cursor-pointer" onclick="viewPrompt('${prompt.id}')">
                <div class="relative aspect-[3/4] rounded-2xl bg-gray-900 p-5 flex flex-col overflow-hidden shadow-lg shadow-gray-200">
                    <div class="flex items-center gap-1.5 mb-4 opacity-50">
                        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <div class="font-mono text-[10px] text-gray-400 leading-relaxed">
                        ${prompt.codePreview ? prompt.codePreview.split('\n').map(line => 
                            `<div>${line}</div>`
                        ).join('') : ''}
                    </div>
                    <div class="mt-auto self-end">
                        <span class="text-4xl text-white/5 font-display font-bold">PY</span>
                    </div>
                </div>
                <div class="flex flex-col gap-0.5 px-1">
                    <h3 class="font-display font-semibold text-[15px] leading-tight text-primary group-hover:text-gray-600 transition-colors">${prompt.title}</h3>
                    <div class="flex items-center justify-between mt-1">
                        <p class="text-[11px] font-medium text-gray-400">${prompt.model}</p>
                        <button class="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-[16px] text-black">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }
}

// Crear tarjeta de agregar
function createAddCard() {
    return `
        <article class="group flex flex-col gap-3 cursor-pointer" onclick="window.location.href='contribute.html'">
            <div class="relative aspect-[3/4] rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all">
                <div class="size-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <span class="material-symbols-outlined text-gray-400 text-xl group-hover:text-black transition-colors">add</span>
                </div>
                <span class="font-display font-medium text-xs text-gray-400 group-hover:text-black">Submit</span>
            </div>
        </article>
    `;
}

// Obtener etiqueta de categoría
function getCategoryLabel(category) {
    const labels = {
        'visuals': 'Visuales',
        'coding': 'Código',
        'writing': 'Escritura',
        'marketing': 'Marketing'
    };
    return labels[category] || category;
}

// Ver detalle de prompt
function viewPrompt(promptId) {
    // Guardar el ID del prompt en sessionStorage para la página de detalle
    sessionStorage.setItem('currentPromptId', promptId);
    window.location.href = 'prompt-detail.html';
}

// Exponer funciones globalmente para que puedan ser usadas en onclick
window.viewPrompt = viewPrompt;

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
