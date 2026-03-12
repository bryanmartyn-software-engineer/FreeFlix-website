// app.js - Enhanced with More Cards and Categories

// Configuration
const CONFIG = {
    API_KEY: "1abb3e68d878be1155d781ce812f80a8",
    BASE_URL: "https://api.themoviedb.org/3",
    IMG_URL: "https://image.tmdb.org/t/p/w500",
    WATCH_BASE_URL: "https://www.vidking.net/embed/movie/"
};

// DOM Elements
const elements = {
    headerPlaceholder: document.getElementById('header-placeholder'),
    moviesContainer: document.getElementById('movies'),
    movieContainer: document.getElementById('movie'),
    playerContainer: document.getElementById('player'),
    recommendationsContainer: document.getElementById('recommendations')
};

// State
let currentPage = 1;
let currentCategory = 'popular';
let totalPages = 1;
let isLoading = false;
let currentView = 'grid';
let searchQuery = '';

// Utility functions
const utils = {
    getCurrentPage: () => {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        if (path.includes('movie.html')) return 'movie';
        if (path.includes('watch.html')) return 'watch';
        return 'home';
    },

    getUrlParams: () => {
        return new URLSearchParams(window.location.search);
    },

    showLoading: (container) => {
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="oled-spinner"></div>
                </div>
            `;
        }
    },

    showError: (container, message) => {
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                    <a href="index.html" class="action-btn" style="margin-top: 20px; display: inline-block;">
                        <i class="fas fa-home"></i> Go Home
                    </a>
                </div>
            `;
        }
    },

    updateMovieCount: (count, total) => {
        const countEl = document.getElementById('movie-count');
        if (countEl) {
            countEl.textContent = `Showing ${count} of ${total}+ movies`;
        }
    },

    updateCategoryTitle: (category) => {
        const titleEl = document.getElementById('category-title');
        if (titleEl) {
            const titles = {
                popular: 'Popular Movies',
                now_playing: 'Now Playing',
                upcoming: 'Upcoming Releases',
                top_rated: 'Top Rated',
                trending: 'Trending Today'
            };
            titleEl.textContent = titles[category] || 'Popular Movies';
        }
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Helper function to escape HTML special characters
    escapeHtml: (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// API service
const api = {
    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('API error');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getMovies(category = 'popular', page = 1, query = '') {
        let url;
        if (query) {
            url = `${CONFIG.BASE_URL}/search/movie?api_key=${CONFIG.API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
        } else if (category === 'trending') {
            url = `${CONFIG.BASE_URL}/trending/movie/week?api_key=${CONFIG.API_KEY}&page=${page}`;
        } else {
            url = `${CONFIG.BASE_URL}/movie/${category}?api_key=${CONFIG.API_KEY}&page=${page}`;
        }
        return this.fetchData(url);
    },

    async getMovieDetails(id) {
        const url = `${CONFIG.BASE_URL}/movie/${id}?api_key=${CONFIG.API_KEY}`;
        return this.fetchData(url);
    },

    async getRecommendations(id) {
        const url = `${CONFIG.BASE_URL}/movie/${id}/recommendations?api_key=${CONFIG.API_KEY}`;
        return this.fetchData(url);
    }
};

// Render functions
const render = {
    header: () => {
        const currentPage = utils.getCurrentPage();
        return `
            <header>
                <div class="logo">
                    <a href="index.html">
                        <span class="logo-triangle">▶</span>
                        <span class="logo-text">FreeFlix</span>
                    </a>
                </div>
                <div class="nav-links">
                    <a href="index.html" class="nav-link ${currentPage === 'home' ? 'active' : ''}">
                        <i class="fas fa-home"></i> Home
                    </a>
                    ${currentPage !== 'home' ? `
                        <div class="search-wrapper">
                            <i class="fas fa-search search-icon"></i>
                            <input type="search" id="search" placeholder="Search movies...">
                        </div>
                    ` : ''}
                </div>
            </header>
        `;
    },

    movies: (movies) => {
        if (!movies || movies.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <p>No movies found</p>
                </div>
            `;
        }

        return movies.map(movie => {
            const poster = movie.poster_path 
                ? CONFIG.IMG_URL + movie.poster_path 
                : 'https://via.placeholder.com/300x450?text=No+Poster';
            const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            
            return `
                <div class="movie-card" data-id="${movie.id}">
                    <a href="movie.html?id=${movie.id}">
                        <div class="poster-container">
                            <img src="${poster}" alt="${utils.escapeHtml(movie.title)}" loading="lazy">
                            <div class="rating">
                                <i class="fas fa-star"></i>
                                ${rating}
                            </div>
                            <div class="movie-overlay">
                                <p><i class="fas fa-calendar"></i> ${year}</p>
                            </div>
                        </div>
                        <h3>${utils.escapeHtml(movie.title)}</h3>
                    </a>
                </div>
            `;
        }).join('');
    },

    movieDetail: (movie) => {
        const poster = movie.poster_path 
            ? CONFIG.IMG_URL + movie.poster_path 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
        
        const watchLink = `${CONFIG.WATCH_BASE_URL}${movie.id}?color=e50914&autoPlay=true`;
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        
        return `
            <div class="detail-card">
                <div class="detail-poster">
                    <img src="${poster}" alt="${utils.escapeHtml(movie.title)}">
                </div>
                <div class="detail-info">
                    <h1>${utils.escapeHtml(movie.title)}</h1>
                    
                    <div class="movie-meta">
                        <span class="meta-tag"><i class="fas fa-calendar"></i> ${year}</span>
                        <span class="meta-tag"><i class="fas fa-star"></i> ${rating}/10</span>
                        <span class="meta-tag"><i class="fas fa-clock"></i> ${movie.runtime || 'N/A'} min</span>
                        <span class="meta-tag highlight"><i class="fas fa-language"></i> ${movie.original_language?.toUpperCase() || 'EN'}</span>
                    </div>

                    <div class="movie-overview">
                        ${utils.escapeHtml(movie.overview) || 'No overview available.'}
                    </div>

                    <a href="${watchLink}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="watch-button">
                        <i class="fas fa-play"></i> WATCH NOW
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    },

    player: (id) => {
        const watchUrl = `${CONFIG.WATCH_BASE_URL}${id}?color=e50914&autoPlay=true`;
        
        return `
            <div class="player-container">
                <div class="player-header">
                    <i class="fas fa-play-circle"></i>
                    <h2>Now Playing on FreeFlix</h2>
                </div>
                <div class="video-container">
                    <iframe 
                        src="${watchUrl}"
                        allowfullscreen
                        allow="autoplay; fullscreen"
                        loading="lazy">
                    </iframe>
                </div>
                <div class="player-actions">
                    <a href="javascript:history.back()" class="action-btn">
                        <i class="fas fa-arrow-left"></i> Go Back
                    </a>
                    <a href="index.html" class="action-btn">
                        <i class="fas fa-home"></i> Home
                    </a>
                </div>
            </div>
        `;
    }
};

// Load movies function
async function loadMovies(page = 1, append = false) {
    if (isLoading) return;
    
    const container = elements.moviesContainer;
    if (!container) return;

    try {
        isLoading = true;
        
        if (!append) {
            utils.showLoading(container);
        }

        const data = await api.getMovies(currentCategory, page, searchQuery);
        
        if (data.results) {
            totalPages = data.total_pages;
            
            if (append) {
                container.innerHTML += render.movies(data.results);
            } else {
                container.innerHTML = render.movies(data.results);
            }
            
            utils.updateMovieCount(data.results.length, data.total_results);
            
            // Update load more button state
            const loadMoreBtn = document.getElementById('load-more');
            if (loadMoreBtn) {
                if (page < totalPages) {
                    loadMoreBtn.style.display = 'inline-flex';
                    loadMoreBtn.classList.remove('loading');
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        }
    } catch (error) {
        if (!append) {
            utils.showError(container, 'Failed to load movies');
        }
    } finally {
        isLoading = false;
    }
}

// Search handlers
function setupSearch() {
    // Hero search
    const heroSearch = document.getElementById('hero-search');
    const heroSearchBtn = document.getElementById('hero-search-btn');
    
    if (heroSearch) {
        const handleSearch = utils.debounce((query) => {
            if (query.length > 2 || query.length === 0) {
                searchQuery = query;
                currentPage = 1;
                loadMovies(1, false);
            }
        }, 500);

        heroSearch.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });

        heroSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchQuery = e.target.value.trim();
                currentPage = 1;
                loadMovies(1, false);
            }
        });
    }

    if (heroSearchBtn) {
        heroSearchBtn.addEventListener('click', () => {
            const query = heroSearch?.value.trim() || '';
            searchQuery = query;
            currentPage = 1;
            loadMovies(1, false);
        });
    }

    // Header search (for non-home pages)
    const headerSearch = document.getElementById('search');
    if (headerSearch) {
        headerSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Search tags
    const searchTags = document.querySelectorAll('.search-tag');
    searchTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.textContent;
            if (heroSearch) {
                heroSearch.value = query;
                searchQuery = query;
                currentPage = 1;
                loadMovies(1, false);
            }
        });
    });
}

// Category buttons
function setupCategories() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update category
            currentCategory = btn.dataset.category;
            currentPage = 1;
            searchQuery = '';
            
            // Clear hero search
            const heroSearch = document.getElementById('hero-search');
            if (heroSearch) {
                heroSearch.value = '';
            }
            
            // Update title and load movies
            utils.updateCategoryTitle(currentCategory);
            loadMovies(1, false);
        });
    });
}

// Load more button
function setupLoadMore() {
    const loadMoreBtn = document.getElementById('load-more');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (!isLoading && currentPage < totalPages) {
                currentPage++;
                loadMovies(currentPage, true);
                
                // Add loading animation
                loadMoreBtn.classList.add('loading');
            }
        });
    }
}

// View options (grid/list)
function setupViewOptions() {
    const viewOptions = document.querySelectorAll('.view-option');
    const moviesGrid = document.getElementById('movies');
    
    viewOptions.forEach(option => {
        option.addEventListener('click', () => {
            viewOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const view = option.dataset.view;
            currentView = view;
            
            if (moviesGrid) {
                if (view === 'list') {
                    moviesGrid.classList.add('list-view');
                } else {
                    moviesGrid.classList.remove('list-view');
                }
            }
        });
    });
}

// Page handlers
const pages = {
    async home() {
        const container = elements.moviesContainer;
        if (!container) return;

        // Get URL params
        const params = utils.getUrlParams();
        searchQuery = params.get('search') || '';
        
        // Set hero search value if exists
        if (searchQuery) {
            const heroSearch = document.getElementById('hero-search');
            if (heroSearch) {
                heroSearch.value = searchQuery;
            }
        }

        // Update category title
        utils.updateCategoryTitle(currentCategory);

        // Setup event listeners
        setupCategories();
        setupLoadMore();
        setupViewOptions();

        // Load movies
        await loadMovies(1, false);
    },

    async movie() {
        const container = elements.movieContainer;
        const recommendationsContainer = elements.recommendationsContainer;
        
        if (!container) return;

        try {
            const params = utils.getUrlParams();
            const id = params.get('id');
            
            if (!id) {
                utils.showError(container, 'No movie ID provided');
                return;
            }

            utils.showLoading(container);
            const movie = await api.getMovieDetails(id);
            container.innerHTML = render.movieDetail(movie);
            
            // Load recommendations
            if (recommendationsContainer) {
                try {
                    const recommendations = await api.getRecommendations(id);
                    if (recommendations.results && recommendations.results.length > 0) {
                        recommendationsContainer.innerHTML = render.movies(recommendations.results.slice(0, 6));
                    } else {
                        recommendationsContainer.innerHTML = `
                            <div class="empty-state" style="grid-column: 1/-1;">
                                <i class="fas fa-film"></i>
                                <p>No recommendations available</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    recommendationsContainer.innerHTML = `
                        <div class="empty-state" style="grid-column: 1/-1;">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Failed to load recommendations</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            utils.showError(container, 'Failed to load movie details');
        }
    },

    watch() {
        const container = elements.playerContainer;
        if (!container) return;

        const params = utils.getUrlParams();
        const id = params.get('id');
        
        if (!id) {
            utils.showError(container, 'No movie ID provided');
            return;
        }

        container.innerHTML = render.player(id);
    }
};

// Initialize app
async function init() {
    // Render header
    if (elements.headerPlaceholder) {
        elements.headerPlaceholder.innerHTML = render.header();
    }

    // Setup search
    setupSearch();

    // Load current page
    const currentPage = utils.getCurrentPage();

    // Hide recommendations section if not on movie page
    const recommendationsSection = document.querySelector('.recommendations-section');
    if (recommendationsSection) {
        recommendationsSection.style.display = currentPage === 'movie' ? 'block' : 'none';
    }

    // Load page content
    await pages[currentPage]();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);