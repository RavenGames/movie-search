// ========================================
// MOVIE SEARCH - JavaScript
// ========================================
// API: OMDb (Open Movie Database)
// Get your API key: https://www.omdbapi.com/apikey.aspx

const API_KEY = "803eca30";
const API_URL = "https://www.omdbapi.com/";

// ========================================
// Animated Space Background
// ========================================

function initializeSpaceBackground() {
  const canvas = document.getElementById("spaceCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  // Star class for animation
  class Star {
    constructor() {
      this.reset();
      this.twinkleRate = Math.random() * 0.03 + 0.01;
      this.twinklePhase = Math.random() * Math.PI * 2;
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.5;
      this.opacity = Math.random() * 0.7 + 0.3;
    }

    update() {
      this.twinklePhase += this.twinkleRate;
      this.opacity =
        Math.sin(this.twinklePhase) * 0.5 + 0.5 * (Math.random() * 0.5 + 0.5);
    }

    draw() {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Create stars
  const stars = [];
  const starCount = 150;
  for (let i = 0; i < starCount; i++) {
    stars.push(new Star());
  }

  // Animation loop
  function animate() {
    // Create nebula-like background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#000814");
    gradient.addColorStop(0.3, "#001233");
    gradient.addColorStop(0.6, "#000814");
    gradient.addColorStop(0.8, "#0a0e27");
    gradient.addColorStop(1, "#000814");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add nebula clouds with colors
    ctx.fillStyle = "rgba(229, 9, 20, 0.04)"; // Red nebula (Netflix red)
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.3, 350, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(30, 144, 255, 0.03)"; // Blue nebula
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.7, 400, 0, Math.PI * 2);
    ctx.fill();

    // Update and draw stars
    stars.forEach((star) => {
      star.update();
      star.draw();
    });

    requestAnimationFrame(animate);
  }

  // Handle window resize
  window.addEventListener("resize", resizeCanvas);

  // Start animation
  animate();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSpaceBackground);
} else {
  initializeSpaceBackground();
}

// State
let currentPage = 1;
let totalResults = 0;
let currentSearch = "";
let watchlist = [];

// DOM Elements
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const searchBtn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("resultsContainer");
const errorMessage = document.getElementById("errorMessage");
const loadingSpinner = document.getElementById("loadingSpinner");
const emptyState = document.getElementById("emptyState");
const paginationContainer = document.getElementById("paginationContainer");
const detailsModal = document.getElementById("detailsModal");
const watchlistPanel = document.getElementById("watchlistPanel");
const watchlistItems = document.getElementById("watchlistItems");
const watchlistToggleFloat = document.getElementById("watchlistToggleFloat");
const clearWatchlistBtn = document.getElementById("clearWatchlist");
const closeWatchlistBtn = document.getElementById("closeWatchlist");

// Event Listeners
searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});
watchlistToggleFloat.addEventListener("click", toggleWatchlistPanel);
closeWatchlistBtn.addEventListener("click", closeWatchlistPanel);
clearWatchlistBtn.addEventListener("click", () => {
  if (confirm("Clear all items from watchlist?")) {
    watchlist = [];
    saveWatchlist();
    renderWatchlist();
  }
});

// ========================================
// Search & Fetch
// ========================================

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showError("Please enter a search term");
    return;
  }

  currentPage = 1;
  currentSearch = query;
  await performSearch();
}

async function performSearch() {
  try {
    clearError();
    show(loadingSpinner);
    hide(emptyState);
    resultsContainer.innerHTML = "";

    // TODO: Add error handling for API key missing
    if (API_KEY === "YOUR_API_KEY") {
      throw new Error(
        "❌ API key not set. Get one from https://www.omdbapi.com/apikey.aspx",
      );
    }

    const type = filterType.value ? `&type=${filterType.value}` : "";
    const url = `${API_URL}?s=${encodeURIComponent(currentSearch)}&page=${currentPage}${type}&apikey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    hide(loadingSpinner);

    if (!data.Response) {
      showError(data.Error || "No results found");
      show(emptyState);
      return;
    }

    totalResults = parseInt(data.totalResults);
    displayResults(data.Search);
    displayPagination();
  } catch (error) {
    hide(loadingSpinner);
    showError(error.message);
  }
}

async function fetchMovieDetails(imdbID) {
  try {
    const url = `${API_URL}?i=${imdbID}&plot=full&apikey=${API_KEY}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error fetching details:", error);
    return null;
  }
}

// ========================================
// Display Results
// ========================================

function displayResults(movies) {
  if (!movies || movies.length === 0) {
    show(emptyState);
    return;
  }

  resultsContainer.innerHTML = movies
    .map(
      (movie) => `
    <div class="movie-card" onclick="viewDetails('${movie.imdbID}')">
      <img 
        src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/180x270?text=No+Poster"}" 
        alt="${movie.Title}" 
        class="movie-poster"
        loading="lazy"
      >
      <div class="movie-info">
        <div class="movie-title">${movie.Title}</div>
        <div class="movie-year">${movie.Year}</div>
        <div class="movie-rating">
          <i class="fas fa-star"></i>
          <span>${movie.imdbRating || "N/A"}</span>
        </div>
        <div class="movie-actions">
          <button class="movie-btn" onclick="event.stopPropagation(); toggleWatchlist('${movie.imdbID}', '${movie.Title}', '${movie.Type}')" title="Add to watchlist">
            <i class="fas fa-heart"></i> Add
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

function displayPagination() {
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(totalResults / 10);

  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Prev";
  prevBtn.className = "pagination-btn";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      performSearch();
    }
  };
  paginationContainer.appendChild(prevBtn);

  // Page numbers
  for (
    let i = Math.max(1, currentPage - 2);
    i <= Math.min(totalPages, currentPage + 2);
    i++
  ) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `pagination-btn ${i === currentPage ? "active" : ""}`;
    btn.onclick = () => {
      currentPage = i;
      performSearch();
    };
    paginationContainer.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next →";
  nextBtn.className = "pagination-btn";
  nextBtn.disabled = currentPage >= totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      performSearch();
    }
  };
  paginationContainer.appendChild(nextBtn);
}

// ========================================
// Modal & Details
// ========================================

async function viewDetails(imdbID) {
  show(loadingSpinner);

  const details = await fetchMovieDetails(imdbID);

  hide(loadingSpinner);

  if (!details || details.Response === "False") {
    showError("Could not load movie details");
    return;
  }

  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">${details.Title}</div>
      <div class="modal-meta">
        <span><strong>Year:</strong> ${details.Year}</span>
        <span><strong>Type:</strong> ${details.Type}</span>
        <span><strong>Rating:</strong> ⭐ ${details.imdbRating}/10</span>
      </div>
    </div>

    <div class="modal-video-wrapper">
      <div id="videoContainer">
        <iframe id="movieTrailer"
          src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(details.Title + " " + details.Year + " official trailer hd")}&autoplay=0&rel=0"
          title="${details.Title} official trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          onerror="showVideoFallback()"
          onload="checkVideoLoad(this)"></iframe>
        <div id="videoFallback" class="video-fallback hidden">
          <div class="fallback-content">
            <i class="fas fa-film"></i>
            <h4>Trailer Unavailable</h4>
            <p>We couldn't find an official trailer for "${details.Title}".</p>
            <div class="fallback-actions">
              <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(details.Title + " " + details.Year + " trailer")}"
                 target="_blank" class="fallback-link youtube-link">
                <i class="fab fa-youtube"></i> Search YouTube
              </a>
              <a href="https://www.imdb.com/title/${details.imdbID}/"
                 target="_blank" class="fallback-link imdb-link">
                <i class="fas fa-external-link-alt"></i> View on IMDb
              </a>
            </div>
          </div>
        </div>
      </div>
      <button class="full-screen-btn" onclick="toggleMovieFullscreen()">
        <i class="fas fa-expand-arrows-alt"></i> Fullscreen
      </button>
    </div>

    ${details.Poster !== "N/A" ? `<img src="${details.Poster}" alt="${details.Title}" class="modal-poster">` : ""}

    ${details.Plot && details.Plot !== "N/A" ? `<div class="modal-plot">${details.Plot}</div>` : ""}

    <div class="modal-details">
      ${details.Director && details.Director !== "N/A" ? `<div class="detail-item"><label>Director</label>${details.Director}</div>` : ""}
      ${details.Writer && details.Writer !== "N/A" ? `<div class="detail-item"><label>Writer</label>${details.Writer}</div>` : ""}
      ${details.Actors && details.Actors !== "N/A" ? `<div class="detail-item"><label>Cast</label>${details.Actors}</div>` : ""}
      ${details.Genre && details.Genre !== "N/A" ? `<div class="detail-item"><label>Genre</label>${details.Genre}</div>` : ""}
      ${details.Language && details.Language !== "N/A" ? `<div class="detail-item"><label>Language</label>${details.Language}</div>` : ""}
      ${details.Country && details.Country !== "N/A" ? `<div class="detail-item"><label>Country</label>${details.Country}</div>` : ""}
      ${details.Runtime && details.Runtime !== "N/A" ? `<div class="detail-item"><label>Runtime</label>${details.Runtime}</div>` : ""}
      ${details.BoxOffice && details.BoxOffice !== "N/A" ? `<div class="detail-item"><label>Box Office</label>${details.BoxOffice}</div>` : ""}
    </div>

    <button class="search-btn" onclick="toggleWatchlist('${details.imdbID}', '${details.Title}', '${details.Type}')">
      <i class="fas fa-bookmark"></i> Add to Watchlist
    </button>
  `;

  detailsModal.classList.remove("hidden");
}

function closeModal() {
  detailsModal.classList.add("hidden");
}

function toggleMovieFullscreen() {
  const videoWrapper = document.querySelector(".modal-video-wrapper");
  if (!videoWrapper) return;

  const element = videoWrapper;
  if (!document.fullscreenElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

function checkVideoLoad(iframe) {
  // Give iframe time to load, then check if it has content
  setTimeout(() => {
    try {
      // Check if iframe loaded successfully by checking its dimensions
      if (iframe.offsetHeight < 50 || iframe.contentWindow.length === 0) {
        showVideoFallback();
        return;
      }

      // Additional check for YouTube error messages
      const checkForErrors = () => {
        try {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc && iframeDoc.body) {
            const bodyText =
              iframeDoc.body.textContent || iframeDoc.body.innerText;
            if (
              bodyText.includes("unavailable") ||
              bodyText.includes("error") ||
              bodyText.includes("not available")
            ) {
              showVideoFallback();
            }
          }
        } catch (e) {
          // Cross-origin restriction is normal, assume it's working
        }
      };

      // Check after additional delay
      setTimeout(checkForErrors, 2000);
    } catch (e) {
      // If we can't check, assume it's working for now
      // The user can click the fallback links if needed
    }
  }, 1500);
}

function showVideoFallback() {
  const trailer = document.getElementById("movieTrailer");
  const fallback = document.getElementById("videoFallback");

  if (trailer && fallback) {
    trailer.style.display = "none";
    fallback.classList.remove("hidden");
  }
}

// ========================================
// Watchlist Management
// ========================================

function toggleWatchlist(imdbID, title, type) {
  const exists = watchlist.find((item) => item.imdbID === imdbID);

  if (exists) {
    watchlist = watchlist.filter((item) => item.imdbID !== imdbID);
  } else {
    watchlist.push({ imdbID, title, type });
  }

  saveWatchlist();
  renderWatchlist();
}

function renderWatchlist() {
  const count = watchlist.length;
  document.getElementById("watchlistCount").textContent =
    count > 0 ? count : "";

  if (watchlist.length === 0) {
    watchlistItems.innerHTML =
      '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No items in watchlist</p>';
    return;
  }

  watchlistItems.innerHTML = watchlist
    .map(
      (item) => `
    <div class="watchlist-item">
      <div>
        <div class="watchlist-item-title">${item.title}</div>
        <div class="watchlist-item-type">${item.type}</div>
      </div>
      <button class="remove-from-watchlist" onclick="toggleWatchlist('${item.imdbID}', '${item.title}', '${item.type}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `,
    )
    .join("");
}

function toggleWatchlistPanel() {
  watchlistPanel.classList.toggle("open");
  const icon = document.querySelector("#toggleWatchlist i");
  if (watchlistPanel.classList.contains("open")) {
    icon.className = "fas fa-chevron-right";
  } else {
    icon.className = "fas fa-chevron-left";
  }
}

function closeWatchlistPanel() {
  watchlistPanel.classList.remove("open");
  const toggleIcon = document.querySelector("#toggleWatchlist i");
  if (toggleIcon) toggleIcon.className = "fas fa-chevron-left";
}

// ========================================
// Storage
// ========================================

function saveWatchlist() {
  localStorage.setItem("movieWatchlist", JSON.stringify(watchlist));
}

function loadWatchlist() {
  const saved = localStorage.getItem("movieWatchlist");
  if (saved) {
    watchlist = JSON.parse(saved);
  }
  renderWatchlist();
}

// ========================================
// UI Utilities
// ========================================

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.remove("show");
}

function show(element) {
  element.classList.remove("hidden");
}

function hide(element) {
  element.classList.add("hidden");
}

// ========================================
// Initialize
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  loadWatchlist();
  show(emptyState);
});

// Close modal on escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ========================================
// TODO / Enhancement Ideas
// ========================================
/*
1. Add caching for API responses
2. Add advanced filters (year, rating, genre)
3. Add sort options (title, rating, year)
4. Add user ratings for watchlist items
5. Add export watchlist to CSV
6. Add TV show episode search
7. Add similar movies/shows suggestions
8. Add runtime filtering
9. Add trailer embed
10. Add PWA support
*/
