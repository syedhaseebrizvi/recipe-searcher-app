// API URL
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// FAVORITES KEY for localStorage
const FAVORITES_KEY = 'recipeFavorites';

// Setup smooth scrolling
function setupAnimations() {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.recipe-card').forEach(card => {
        observer.observe(card);
    });
}

// Animate search results
function animateResults() {
    const cards = document.querySelectorAll('.recipe-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

// Fetch recipes from TheMealDB API
async function searchRecipes(searchTerm) {
    const response = await fetch(`${API_BASE_URL}/search.php?s=${searchTerm}`);
    const data = await response.json();
    return data.meals;
}

// Fetch recipe by ID
async function getRecipeById(id) {
    const response = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
    const data = await response.json();
    return data.meals[0];
}

// Setup favorites management
function setupFavorites() {
    const toggleFavoritesBtn = document.getElementById('toggleFavorites');
    const clearFavoritesBtn = document.getElementById('clearFavorites');
    
    toggleFavoritesBtn.addEventListener('click', toggleFavoritesList);
    clearFavoritesBtn.addEventListener('click', clearAllFavorites); // Adding event listener to clear all favorites
    
    updateFavoritesCounter(); // Initialize the counter at page load
}

function getFavorites() {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
}

function toggleFavorite(recipeId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(recipeId);
    
    if (index === -1) {
        favorites.push(recipeId);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    updateFavoritesCounter(); // Update counter after adding/removing a favorite
    showActionMessage(index === -1 ? 'Added to favorites!' : 'Removed from favorites'); // Show action message
    return index === -1;
}

function isFavorite(recipeId) {
    const favorites = getFavorites();
    return favorites.includes(recipeId);
}

function updateFavoritesCounter() {
    const favorites = getFavorites();
    const favoriteCountElement = document.getElementById('favoriteCount');
    favoriteCountElement.textContent = favorites.length; // Update the counter text
}

async function toggleFavoritesList() {
    const favorites = getFavorites();
    const resultsContainer = document.getElementById('results');
    const toggleButton = document.getElementById('toggleFavorites');
    
    if (toggleButton.dataset.showing === 'true') {
        if (window.lastSearchResults) {
            displayResults(window.lastSearchResults);
        } else {
            resultsContainer.innerHTML = '<p class="text-white text-center col-span-full">Search for recipes to see results</p>';
        }
        toggleButton.innerHTML = '<i class="fas fa-heart text-2xl"></i>';
        toggleButton.dataset.showing = 'false';
    } else {
        if (favorites.length === 0) {
            resultsContainer.innerHTML = '<p class="text-white text-center col-span-full">No favorite recipes yet</p>';
        } else {
            const recipes = await Promise.all(
                favorites.map(id => getRecipeById(id))
            );
            displayResults(recipes);
        }
        toggleButton.innerHTML = '<i class="fas fa-heart text-2xl"></i>';
        toggleButton.dataset.showing = 'true';
    }
}

// Function to clear all favorites
function clearAllFavorites() {
    localStorage.removeItem(FAVORITES_KEY); // Remove favorites from localStorage
    updateFavoritesCounter(); // Update the counter after clearing
    displayResults([]); // Optionally, clear the displayed results
    showActionMessage('All favorites cleared!'); // Show action message
}

// Show action message (e.g., "Added to favorites", "Removed from favorites")
function showActionMessage(message) {
    const actionMessage = document.getElementById('actionMessage');
    actionMessage.textContent = message;
    actionMessage.classList.add('show');
    
    // Hide action message after 3 seconds
    setTimeout(() => {
        actionMessage.classList.remove('show');
    }, 3000);
}

// Setup modal for recipe details
function setupModal() {
    const modal = document.getElementById('recipeModal');
    const closeModal = document.getElementById('closeModal');

    closeModal.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    window.showRecipeDetails = showRecipeDetails;
}

async function showRecipeDetails(id) {
    const modal = document.getElementById('recipeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const favoriteButton = document.getElementById('favoriteButton');
    
    try {
        const recipe = await getRecipeById(id);
        
        favoriteButton.innerHTML = `<i class="fas fa-heart text-2xl ${isFavorite(id) ? 'text-red-500' : 'text-gray-300'}"></i>`;
        favoriteButton.onclick = () => {
            const isNowFavorite = toggleFavorite(id);
            favoriteButton.querySelector('i').classList.toggle('text-red-500', isNowFavorite);
            favoriteButton.querySelector('i').classList.toggle('text-gray-300', !isNowFavorite);
        };

        modalTitle.textContent = recipe.strMeal;
        modalContent.innerHTML = generateRecipeContent(recipe);
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching recipe details:', error);
    }
}

function generateRecipeContent(recipe) {
    const ingredients = getIngredientsList(recipe);
    
    return `
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="w-full h-64 object-cover rounded-lg mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <h3 class="text-xl font-semibold mb-2">Ingredients</h3>
                <ul class="list-disc pl-5">
                    ${ingredients.map(item => ` 
                        <li>${item.measure} ${item.ingredient}</li>
                    `).join('')}
                </ul>
            </div>
            <div>
                <h3 class="text-xl font-semibold mb-2">Category & Origin</h3>
                <p><strong>Category:</strong> ${recipe.strCategory}</p>
                <p><strong>Origin:</strong> ${recipe.strArea}</p>
                ${recipe.strTags ? `<p><strong>Tags:</strong> ${recipe.strTags}</p>` : ''}
            </div>
        </div>
        <div>
            <h3 class="text-xl font-semibold mb-2">Instructions</h3>
            <p class="whitespace-pre-line">${recipe.strInstructions}</p>
        </div>
        ${recipe.strYoutube ? `
            <div class="mt-6">
                <h3 class="text-xl font-semibold mb-2">Video Tutorial</h3>
                <a href="${recipe.strYoutube}" target="_blank" 
                   class="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    Watch on YouTube
                </a>
            </div>
        ` : ''}
    `;
}

function getIngredientsList(recipe) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        if (recipe[`strIngredient${i}`]) {
            ingredients.push({
                ingredient: recipe[`strIngredient${i}`],
                measure: recipe[`strMeasure${i}`]
            });
        }
    }
    return ingredients;
}

// Setup responsive design
function setupResponsive() {
    const header = document.querySelector('header');
    const searchContainer = document.querySelector('.search-container');
    
    const handleMobileLayout = () => {
        if (window.innerWidth < 768) {
            header.classList.add('mobile-header');
            searchContainer.classList.add('mobile-search');
        } else {
            header.classList.remove('mobile-header');
            searchContainer.classList.remove('mobile-search');
        }
    };

    handleMobileLayout();
    window.addEventListener('resize', handleMobileLayout);
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton'); // Search button in the search bar
    const headerSearchButton = document.getElementById('headerSearchButton'); // Search icon in the header
    const homeButton = document.getElementById('homeButton');
    const searchContainer = document.querySelector('.search-container'); // The search container
    const resultsContainer = document.getElementById('results'); // The results container

    // Handle search when clicking the search button in the search bar
    searchButton.addEventListener('click', handleSearch);

    // Handle search when pressing Enter in the search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Handle clicking the search icon in the header
    headerSearchButton.addEventListener('click', () => {
        // Show the search container (if hidden)
        searchContainer.classList.remove('hidden');

        // Clear the search input and results
        searchInput.value = '';
        resultsContainer.innerHTML = '<p class="text-white text-center col-span-full">Search for your favorite recipes!</p>';
        window.lastSearchResults = null;

        // Focus the search input for immediate typing
        searchInput.focus();
    });

    // Handle clicking the home button
    homeButton.addEventListener('click', () => {
        searchInput.value = '';
        resultsContainer.innerHTML = '<p class="text-white text-center col-span-full">Search for your favorite recipes!</p>';
        window.lastSearchResults = null;
    });
}

async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    try {
        const meals = await searchRecipes(searchTerm);
        window.lastSearchResults = meals;
        displayResults(meals);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        document.getElementById('results').innerHTML = 
            '<p class="text-white text-center col-span-full">Error fetching recipes. Please try again.</p>';
    }
}

// Display search results
function displayResults(meals) {
    const resultsContainer = document.getElementById('results');
    
    if (!meals || meals.length === 0) {
        resultsContainer.innerHTML = '<p class="text-white text-center col-span-full">No recipes found.</p>';
        return;
    }

    resultsContainer.innerHTML = meals.map(meal => `
        <div class="recipe-card bg-white shadow-lg rounded-lg p-4 cursor-pointer" 
             onclick="showRecipeDetails(${meal.idMeal})">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-40 object-cover rounded-lg mb-4">
            <h3 class="text-lg font-semibold">${meal.strMeal}</h3>
        </div>
    `).join('');

    animateResults();
}

document.addEventListener('DOMContentLoaded', () => {
    setupAnimations();
    setupFavorites();
    setupModal();
    setupSearch();
    setupResponsive();
    updateFavoritesCounter();
});
