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
    searchQuery: '',
    searchQuery: '',
    currentPage: 1,
    itemsPerPage: 60
};

// CONFIGURACIÓN DE PUBLICIDAD (ADSENSE)
const GOOGLE_AD_CODE = `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5747426531124165"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-format="fluid"
     data-ad-layout-key="-6t+ed+2i-1n-4w"
     data-ad-client="ca-pub-5747426531124165"
     data-ad-slot="3534077285"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`;

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

// Función para verificar si el usuario es administrador
function isAdmin() {
    if (!AppState.currentUser) return false;

    // Verificar si es el administrador
    return AppState.currentUser.email === 'santyguz777@gmail.com' ||
        AppState.currentUser.username === 'santyguz77';
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

// Inicializar la aplicación
async function init() {
    // Analytics: Registrar visita (una vez por sesión)
    if (!sessionStorage.getItem('visitRecorded')) {
        fetch(`${API_URL}/analytics/visit`, { method: 'POST' })
            .then(() => console.log('📊 Visita registrada'))
            .catch(console.error);
        sessionStorage.setItem('visitRecorded', 'true');
    }

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

        AppState.prompts = prompts;
        AppState.categories = categories;
        AppState.likes = likes;

    } catch (error) {
        console.error('❌ Error conectando con el servidor:', error);
        // No mostrar alerta intrusiva si falla silenciosamente
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
            AppState.currentPage = 1; // Resetear paginación
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
            AppState.currentPage = 1; // Resetear paginación
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
    const paginationContainer = document.getElementById('pagination');
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

    // Paginación
    const totalItems = filteredPrompts.length;
    const totalPages = Math.ceil(totalItems / AppState.itemsPerPage);

    // Asegurar que la página actual es válida
    if (AppState.currentPage > totalPages) AppState.currentPage = 1;
    if (AppState.currentPage < 1) AppState.currentPage = 1;

    const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
    const endIndex = startIndex + AppState.itemsPerPage;
    const paginatedPrompts = filteredPrompts.slice(startIndex, endIndex);

    // Renderizar Grid con anuncios intercalados
    let gridHTML = '';
    paginatedPrompts.forEach((prompt, index) => {
        gridHTML += createPromptCard(prompt);
        // Insertar anuncio cada 6 items
        if ((index + 1) % 6 === 0) {
            gridHTML += createAdCard();
        }
    });

    // Agregar tarjeta de "Agregar" solo al final de la última página
    if (AppState.currentPage === totalPages || totalPages === 0) {
        gridHTML += createAddCard();
    }

    grid.innerHTML = gridHTML;

    // Renderizar Paginación
    renderPagination(paginationContainer, totalPages);
}

// Crear tarjeta de anuncio (Publicidad)
function createAdCard() {
    return `
        <article class="group flex flex-col gap-3 cursor-default">
            <div class="relative aspect-[3/4] rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center overflow-hidden">
                <span class="absolute top-3 right-3 text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-white px-1.5 py-0.5 rounded shadow-sm z-10">Ad</span>
                <!-- Google AdSense Container -->
                <div class="w-full h-full flex items-center justify-center text-gray-300 text-xs text-center px-4 overflow-hidden relative">
                     ${GOOGLE_AD_CODE}
                </div>
            </div>
            <div class="flex flex-col gap-0.5 px-1 opacity-60">
                <h3 class="font-display font-semibold text-[15px] leading-tight text-gray-400">Patrocinado</h3>
                <p class="text-[11px] font-medium text-gray-300">Google Ads</p>
            </div>
        </article>
    `;
}

// Renderizar controles de paginación
function renderPagination(container, totalPages) {
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Botón Anterior
    if (AppState.currentPage > 1) {
        html += `<button onclick="changePage(${AppState.currentPage - 1})" class="size-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-colors">
            <span class="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>`;
    }

    // Números de página
    // Mostrar rango inteligente: 1 ... 4 5 [6] 7 8 ... 20
    const maxVisible = 5;
    let startPage = Math.max(1, AppState.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button onclick="changePage(1)" class="size-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-colors text-sm font-medium">1</button>`;
        if (startPage > 2) html += `<span class="px-1 text-gray-400">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === AppState.currentPage;
        html += `<button onclick="changePage(${i})" class="size-10 flex items-center justify-center rounded-full border transition-colors text-sm font-medium ${isActive ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black'}">
            ${i}
        </button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="px-1 text-gray-400">...</span>`;
        html += `<button onclick="changePage(${totalPages})" class="size-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-colors text-sm font-medium">${totalPages}</button>`;
    }

    // Botón Siguiente
    if (AppState.currentPage < totalPages) {
        html += `<button onclick="changePage(${AppState.currentPage + 1})" class="size-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-colors">
            <span class="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>`;
    }

    container.innerHTML = html;
}

// Función global para cambiar página
window.changePage = function (page) {
    AppState.currentPage = page;
    renderPrompts();
    // Scroll suave hacia arriba
    document.getElementById('promptsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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
                    <p class="font-body text-xs leading-relaxed text-gray-600 line-clamp-[8] overflow-hidden">
                        ${Utils.truncateText(prompt.prompt, 180)}
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
        // Determinar qué contenido mostrar: codePreview o un snippet del prompt
        let contentPreview = '';
        if (prompt.codePreview) {
            contentPreview = prompt.codePreview.split('\n').slice(0, 6).map(line => `<div>${line}</div>`).join('');
        } else {
            // Fallback al prompt si no hay preview de código, simulando código
            contentPreview = `<div class="whitespace-pre-wrap font-sans text-gray-400 opacity-80">${Utils.truncateText(prompt.prompt, 120)}</div>`;
        }

        return `
            <article class="group flex flex-col gap-3 cursor-pointer" onclick="viewPrompt('${prompt.id}')">
                <div class="relative aspect-[3/4] rounded-2xl bg-gray-900 p-5 flex flex-col overflow-hidden shadow-lg shadow-gray-200">
                    <div class="flex items-center gap-1.5 mb-4 opacity-50">
                        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <div class="font-mono text-[10px] text-gray-400 leading-relaxed overflow-hidden">
                        ${contentPreview}
                    </div>
                    <div class="mt-auto self-end">
                        <span class="text-xs text-gray-600 font-display font-bold uppercase tracking-wider border border-gray-700 px-2 py-1 rounded">Code</span>
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
