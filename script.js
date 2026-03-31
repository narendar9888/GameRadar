const API_KEY = "6b687689d118432689d662acc5211ed9";
const BASE_URL = "https://api.rawg.io/api/games";





const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const gameContainer = document.getElementById("gameContainer");
const loading = document.getElementById("loading");
const error = document.getElementById("error");

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

async function fetchGames(query = "action") {
  showLoading();
  hideError();

  try {
    const response = await fetch(
      `${BASE_URL}?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=12`
    );

    const data = await response.json();

    if (!data.results) {
      gameContainer.innerHTML = "<p>No games found.</p>";
      showError("No games found.");
      return;
    }

    renderGames(data.results);
  } catch (err) {
    gameContainer.innerHTML = "";
    showError("Failed to fetch game data.");
  } finally {
    hideLoading();
  }
}

function renderGames(games) {
  gameContainer.innerHTML = games
    .map(
      (game) => `
      <div class="game-card">
        <img src="${game.background_image || "https://via.placeholder.com/400x220?text=No+Image"}" alt="${game.name}">
        <div class="game-content">
          <h3>${game.name}</h3>
          <p><strong>Rating:</strong> ${game.rating || "N/A"}</p>
          <p><strong>Released:</strong> ${game.released || "N/A"}</p>
        </div>
      </div>
    `
    )
    .join("");
}

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim() || "action";
  fetchGames(query);
});

fetchGames();