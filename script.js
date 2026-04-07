const API_KEY = "6b687689d118432689d662acc5211ed9";
const BASE_URL = "https://api.rawg.io/api/games";

const gameContainer = document.getElementById("gameContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const searchInput = document.getElementById("searchInput");
const platformFilter = document.getElementById("platformFilter");
const genreFilter = document.getElementById("genreFilter");
const sortSelect = document.getElementById("sortSelect");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const themeToggle = document.getElementById("themeToggle");

const gameModal = document.getElementById("gameModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

let games = [];
let favorites = JSON.parse(localStorage.getItem("favoriteGames")) || [];
let debounceTimer;

function showLoading() {
  loading.classList.remove("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showError(message) {
  error.textContent = message;
  error.classList.remove("hidden");
}

function hideError() {
  error.classList.add("hidden");
}

function getPlatforms(platforms) {
  return (platforms || []).map(function (item) {
    return item.platform.name;
  }).join(", ");
}

function getGenres(genres) {
  return (genres || []).map(function (item) {
    return item.name;
  }).join(", ");
}

function hasSelectedPlatform(game, selectedPlatform) {
  if (selectedPlatform === "all") {
    return true;
  }

  const names = (game.parent_platforms || []).map(function (item) {
    return item.platform.name.toLowerCase();
  });

  return names.some(function (name) {
    return name.includes(selectedPlatform);
  });
}

function hasSelectedGenre(game, selectedGenre) {
  if (selectedGenre === "all") {
    return true;
  }

  const genreNames = (game.genres || []).map(function (item) {
    return item.name.toLowerCase();
  });

  return genreNames.some(function (name) {
    return name.includes(selectedGenre);
  });
}

async function fetchGames(query = "action") {
  showLoading();
  hideError();

  try {
    const response = await fetch(
      `${BASE_URL}?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=15`
    );

    const data = await response.json();

    if (!data.results) {
      games = [];
      renderGames([]);
      showError("No games found.");
      return;
    }

    games = data.results;
    applyFiltersAndSort();
  } catch (err) {
    games = [];
    renderGames([]);
    showError("Failed to fetch game data.");
  } finally {
    hideLoading();
  }
}

function renderGames(gameList) {
  if (gameList.length === 0) {
    gameContainer.innerHTML = '<p class="no-data">No games found.</p>';
    return;
  }

  gameContainer.innerHTML = gameList.map(function (game) {
    return `
      <div class="game-card">
        <img src="${game.background_image || 'https://via.placeholder.com/400x250?text=No+Image'}" alt="${game.name}">
        <div class="game-content">
          <h3>${game.name}</h3>
          <p><strong>Rating:</strong> ${game.rating || "N/A"}</p>
          <p><strong>Released:</strong> ${game.released || "N/A"}</p>
          <p><strong>Genres:</strong> ${getGenres(game.genres) || "N/A"}</p>
          <p><strong>Platforms:</strong> ${getPlatforms(game.parent_platforms) || "N/A"}</p>
          <div class="card-buttons">
            <button class="favorite-btn" onclick="addToFavorites(${game.id})">Favorite</button>
            <button class="details-btn" onclick="openGameDetails(${game.id})">View Details</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderFavorites() {
  if (favorites.length === 0) {
    favoritesContainer.innerHTML = '<p class="no-data">No favorite games added yet.</p>';
    return;
  }

  favoritesContainer.innerHTML = favorites.map(function (game) {
    return `
      <div class="game-card">
        <img src="${game.background_image || 'https://via.placeholder.com/400x250?text=No+Image'}" alt="${game.name}">
        <div class="game-content">
          <h3>${game.name}</h3>
          <p><strong>Rating:</strong> ${game.rating || "N/A"}</p>
          <p><strong>Released:</strong> ${game.released || "N/A"}</p>
          <p><strong>Genres:</strong> ${getGenres(game.genres) || "N/A"}</p>
          <div class="card-buttons">
            <button class="remove-btn" onclick="removeFromFavorites(${game.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function addToFavorites(id) {
  const selectedGame = games.find(function (game) {
    return game.id === id;
  });

  const alreadyExists = favorites.some(function (game) {
    return game.id === id;
  });

  if (selectedGame && !alreadyExists) {
    favorites.push(selectedGame);
    localStorage.setItem("favoriteGames", JSON.stringify(favorites));
    renderFavorites();
  }
}

function removeFromFavorites(id) {
  favorites = favorites.filter(function (game) {
    return game.id !== id;
  });

  localStorage.setItem("favoriteGames", JSON.stringify(favorites));
  renderFavorites();
}

function applyFiltersAndSort() {
  const searchValue = searchInput.value.toLowerCase().trim();
  const selectedPlatform = platformFilter.value;
  const selectedGenre = genreFilter.value;
  const selectedSort = sortSelect.value;

  let filteredGames = games
    .filter(function (game) {
      return game.name.toLowerCase().includes(searchValue);
    })
    .filter(function (game) {
      return hasSelectedPlatform(game, selectedPlatform);
    })
    .filter(function (game) {
      return hasSelectedGenre(game, selectedGenre);
    });

  if (selectedSort === "ratingDesc") {
    filteredGames = [...filteredGames].sort(function (a, b) {
      return b.rating - a.rating;
    });
  } else if (selectedSort === "ratingAsc") {
    filteredGames = [...filteredGames].sort(function (a, b) {
      return a.rating - b.rating;
    });
  } else if (selectedSort === "dateDesc") {
    filteredGames = [...filteredGames].sort(function (a, b) {
      return new Date(b.released) - new Date(a.released);
    });
  } else if (selectedSort === "dateAsc") {
    filteredGames = [...filteredGames].sort(function (a, b) {
      return new Date(a.released) - new Date(b.released);
    });
  } else if (selectedSort === "az") {
    filteredGames = [...filteredGames].sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  } else if (selectedSort === "za") {
    filteredGames = [...filteredGames].sort(function (a, b) {
      return b.name.localeCompare(a.name);
    });
  }

  renderGames(filteredGames);
}

async function openGameDetails(id) {
  try {
    showLoading();

    const response = await fetch(`${BASE_URL}/${id}?key=${API_KEY}`);
    const game = await response.json();

    modalBody.innerHTML = `
      <div class="modal-hero">
        <img src="${game.background_image || 'https://via.placeholder.com/900x400?text=No+Image'}" alt="${game.name}">
        <div class="modal-hero-overlay"></div>

        <div class="modal-title-box">
          <h2>${game.name || "Game Title"}</h2>
          <div class="modal-badges">
            <span class="modal-badge">⭐ Rating: ${game.rating || "N/A"}</span>
            <span class="modal-badge">📅 Released: ${game.released || "N/A"}</span>
            <span class="modal-badge">🎮 Metacritic: ${game.metacritic || "N/A"}</span>
          </div>
        </div>
      </div>

      <div class="modal-details">
        <div class="modal-info-grid">
          <div class="modal-info-card">
            <h4>Genres</h4>
            <p>${getGenres(game.genres) || "No genre available"}</p>
          </div>

          <div class="modal-info-card">
            <h4>Platforms</h4>
            <p>${getPlatforms(game.parent_platforms) || "No platform available"}</p>
          </div>

          <div class="modal-info-card">
            <h4>Publishers</h4>
            <p>${(game.publishers || []).map(function (item) {
              return item.name;
            }).join(", ") || "No publisher available"}</p>
          </div>

          <div class="modal-info-card">
            <h4>Developers</h4>
            <p>${(game.developers || []).map(function (item) {
              return item.name;
            }).join(", ") || "No developer available"}</p>
          </div>
        </div>

        <div class="modal-description">
          <h3>About this game</h3>
          <p>${game.description_raw || "No description available for this game."}</p>
        </div>
      </div>
    `;

    gameModal.classList.remove("hidden");
  } catch (err) {
    showError("Failed to load game details.");
  } finally {
    hideLoading();
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  if (isDark) {
    themeToggle.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light Mode";
  }
}

function debounceSearch() {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(function () {
    const query = searchInput.value.trim() || "action";
    fetchGames(query);
  }, 500);
}

searchInput.addEventListener("input", debounceSearch);
platformFilter.addEventListener("change", applyFiltersAndSort);
genreFilter.addEventListener("change", applyFiltersAndSort);
sortSelect.addEventListener("change", applyFiltersAndSort);
themeToggle.addEventListener("click", toggleTheme);

closeModal.addEventListener("click", function () {
  gameModal.classList.add("hidden");
});

gameModal.addEventListener("click", function (e) {
  if (e.target === gameModal) {
    gameModal.classList.add("hidden");
  }
});

loadTheme();
renderFavorites();
fetchGames();