// ============================
// DATA AND INITIALIZATION
// ============================

// Item data - movies and books with tags
const items = [
    {
        id: 1,
        title: "The Matrix",
        type: "movie",
        description: "A computer hacker learns from mysterious rebels about the true nature of his reality.",
        tags: ["sci-fi", "action", "thriller"],
        imageIcon: "🎬"
    },
    {
        id: 2,
        title: "The Lord of the Rings",
        type: "book",
        description: "A meek Hobbit and eight companions set out to destroy the One Ring.",
        tags: ["fantasy", "adventure", "drama"],
        imageIcon: "📚"
    },
    {
        id: 3,
        title: "Inception",
        type: "movie",
        description: "A thief who steals corporate secrets through dream-sharing technology.",
        tags: ["sci-fi", "action", "thriller", "mystery"],
        imageIcon: "🎬"
    },
    {
        id: 4,
        title: "Pride and Prejudice",
        type: "book",
        description: "Story about the turbulent relationship between Elizabeth Bennet and Mr. Darcy.",
        tags: ["romance", "drama", "classic"],
        imageIcon: "📚"
    },
    {
        id: 5,
        title: "Interstellar",
        type: "movie",
        description: "A team of explorers travel through a wormhole in space to ensure humanity's survival.",
        tags: ["sci-fi", "drama", "adventure"],
        imageIcon: "🎬"
    },
    {
        id: 6,
        title: "Harry Potter and the Sorcerer's Stone",
        type: "book",
        description: "A young boy discovers he is a wizard and attends a magical school.",
        tags: ["fantasy", "adventure", "mystery"],
        imageIcon: "📚"
    },
    {
        id: 7,
        title: "The Dark Knight",
        type: "movie",
        description: "Batman faces the Joker, a criminal mastermind who seeks to undermine order in Gotham.",
        tags: ["action", "crime", "drama", "thriller"],
        imageIcon: "🎬"
    },
    {
        id: 8,
        title: "The Hitchhiker's Guide to the Galaxy",
        type: "book",
        description: "Miserable Earthling Arthur Dent is rescued by his friend Ford Prefect.",
        tags: ["sci-fi", "comedy", "adventure"],
        imageIcon: "📚"
    },
    {
        id: 9,
        title: "hum aapke hai kon",
        type: "movie",
        description: "romance movie",
        tags: ["romance", "drama", "comedy", "music"],
        imageIcon: "🎬"
    },
    {
        id: 10,
        title: "The Da Vinci Code",
        type: "book",
        description: "A murder in the Louvre Museum leads to a battle between secret societies.",
        tags: ["mystery", "thriller", "adventure"],
        imageIcon: "📚"
    }
];

// Pre-populated ratings matrix for 5 example users (user0-user4)
// Each sub-array represents a user's ratings for items with ids 1-10
// 0 means the user hasn't rated that item
const exampleRatingsMatrix = [
    [5, 4, 0, 2, 5, 0, 4, 0, 3, 0], // User 0
    [0, 5, 4, 0, 3, 5, 0, 4, 0, 2], // User 1
    [3, 0, 5, 4, 0, 3, 5, 0, 4, 0], // User 2
    [0, 4, 0, 5, 4, 0, 3, 5, 0, 4], // User 3
    [4, 0, 3, 0, 5, 4, 0, 3, 5, 0]  // User 4
];

// All unique tags across all items
const allTags = [...new Set(items.flatMap(item => item.tags))];

// Current user state
let userState = {
    likedItems: [], // Array of item ids
    ratings: {}     // Object with itemId as key and rating (1-5) as value
};

// ============================
// STORAGE FUNCTIONS
// ============================

/**
 * Load user state from localStorage
 */
function loadUserState() {
    const savedState = localStorage.getItem('recommendationAppUserState');
    if (savedState) {
        try {
            userState = JSON.parse(savedState);
        } catch (e) {
            console.error("Failed to parse saved user state", e);
        }
    }
}

/**
 * Save user state to localStorage
 */
function saveUserState() {
    localStorage.setItem('recommendationAppUserState', JSON.stringify(userState));
}

/**
 * Reset user state (clear likes and ratings)
 */
function resetUserState() {
    userState = {
        likedItems: [],
        ratings: {}
    };
    saveUserState();
    renderAll();
}

// ============================
// CONTENT-BASED RECOMMENDATION
// ============================

/**
 * Convert an item to a tag vector (binary representation)
 * @param {Object} item - The item to convert
 * @returns {Array} - Binary vector representing the item's tags
 */
function itemToVector(item) {
    return allTags.map(tag => item.tags.includes(tag) ? 1 : 0);
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {Number} - Cosine similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
    // Calculate dot product
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
    }
    
    // Calculate magnitudes
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    
    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate user preference vector from liked items
 * @returns {Array} - User preference vector
 */
function getUserPreferenceVector() {
    // Start with zero vector
    const userVector = new Array(allTags.length).fill(0);
    
    // If no liked items, return zero vector
    if (userState.likedItems.length === 0) return userVector;
    
    // Sum vectors of liked items
    userState.likedItems.forEach(itemId => {
        const item = items.find(item => item.id === itemId);
        if (item) {
            const itemVector = itemToVector(item);
            for (let i = 0; i < userVector.length; i++) {
                userVector[i] += itemVector[i];
            }
        }
    });
    
    return userVector;
}

/**
 * Get content-based recommendations
 * @returns {Array} - Recommended items with similarity scores
 */
function getContentBasedRecommendations() {
    // Get user preference vector
    const userVector = getUserPreferenceVector();
    
    // If user hasn't liked any items, return empty array
    if (userVector.every(val => val === 0)) return [];
    
    // Calculate similarity for each item not already liked
    const itemScores = [];
    
    items.forEach(item => {
        // Skip items already liked by the user
        if (userState.likedItems.includes(item.id)) return;
        
        // Calculate similarity
        const itemVector = itemToVector(item);
        const similarity = cosineSimilarity(userVector, itemVector);
        
        // Find matching tags for explanation
        const matchingTags = allTags.filter((tag, index) => 
            userVector[index] > 0 && itemVector[index] > 0
        );
        
        itemScores.push({
            item: item,
            score: similarity,
            matchingTags: matchingTags
        });
    });
    
    // Sort by score (descending) and return top 5
    return itemScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

// ============================
// COLLABORATIVE FILTERING
// ============================

/**
 * Calculate Pearson correlation between two users
 * @param {Array} userARatings - Ratings of user A (including current user)
 * @param {Array} userBRatings - Ratings of user B (example user)
 * @returns {Number} - Pearson correlation coefficient (-1 to 1)
 */
function pearsonCorrelation(userARatings, userBRatings) {
    // Find items rated by both users
    const commonItems = [];
    for (let i = 0; i < userARatings.length; i++) {
        if (userARatings[i] > 0 && userBRatings[i] > 0) {
            commonItems.push({ a: userARatings[i], b: userBRatings[i] });
        }
    }
    
    // Need at least 2 common items to calculate correlation
    if (commonItems.length < 2) return 0;
    
    // Calculate means
    const meanA = commonItems.reduce((sum, item) => sum + item.a, 0) / commonItems.length;
    const meanB = commonItems.reduce((sum, item) => sum + item.b, 0) / commonItems.length;
    
    // Calculate numerator and denominators
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;
    
    for (const item of commonItems) {
        const diffA = item.a - meanA;
        const diffB = item.b - meanB;
        numerator += diffA * diffB;
        denomA += diffA * diffA;
        denomB += diffB * diffB;
    }
    
    // Avoid division by zero
    if (denomA === 0 || denomB === 0) return 0;
    
    return numerator / Math.sqrt(denomA * denomB);
}

/**
 * Get collaborative filtering recommendations
 * @returns {Array} - Recommended items with predicted ratings
 */
function getCollaborativeRecommendations() {
    // Create current user's rating vector (aligned with item ids 1-10)
    const currentUserRatings = new Array(items.length).fill(0);
    items.forEach(item => {
        if (userState.ratings[item.id]) {
            currentUserRatings[item.id - 1] = userState.ratings[item.id];
        }
    });
    
    // If user hasn't rated any items, return empty array
    if (currentUserRatings.every(rating => rating === 0)) return [];
    
    // Calculate similarity with each example user
    const userSimilarities = exampleRatingsMatrix.map((exampleUserRatings, index) => ({
        userId: index,
        similarity: pearsonCorrelation(currentUserRatings, exampleUserRatings)
    }));
    
    // Filter out negative similarities and sort by similarity (descending)
    const positiveSimilarities = userSimilarities
        .filter(user => user.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity);
    
    // If no similar users found, return empty array
    if (positiveSimilarities.length === 0) return [];
    
    // Predict ratings for items not rated by current user
    const predictions = [];
    
    items.forEach((item, index) => {
        // Skip items already rated by current user
        if (currentUserRatings[index] > 0) return;
        
        // Calculate weighted average rating from similar users
        let weightedSum = 0;
        let similaritySum = 0;
        
        positiveSimilarities.forEach(similarUser => {
            const rating = exampleRatingsMatrix[similarUser.userId][index];
            if (rating > 0) {
                weightedSum += similarUser.similarity * rating;
                similaritySum += Math.abs(similarUser.similarity);
            }
        });
        
        // Only predict if we have data from similar users
        if (similaritySum > 0) {
            const predictedRating = weightedSum / similaritySum;
            predictions.push({
                item: item,
                predictedRating: predictedRating
            });
        }
    });
    
    // Sort by predicted rating (descending) and return top 5
    return predictions
        .sort((a, b) => b.predictedRating - a.predictedRating)
        .slice(0, 5);
}

// ============================
// DOM RENDERING FUNCTIONS
// ============================

/**
 * Render the items grid
 */
function renderItemsGrid() {
    const itemsGrid = document.getElementById('items-grid');
    if (!itemsGrid) return;
    
    // Get filter values
    const tagFilter = document.getElementById('tag-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    // Filter items based on selections
    const filteredItems = items.filter(item => {
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;
        if (tagFilter !== 'all' && !item.tags.includes(tagFilter)) return false;
        return true;
    });
    
    // Clear the grid
    itemsGrid.innerHTML = '';
    
    // Render each item
    filteredItems.forEach(item => {
        const isLiked = userState.likedItems.includes(item.id);
        const userRating = userState.ratings[item.id] || 0;
        
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.innerHTML = `
            <div class="item-image">${item.imageIcon}</div>
            <div class="item-content">
                <h3 class="item-title">${item.title}</h3>
                <span class="item-type">${item.type === 'movie' ? '🎬 Movie' : '📚 Book'}</span>
                <p class="item-description">${item.description}</p>
                <div class="item-tags">
                    ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="item-actions">
                    <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${item.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <div class="rating-control">
                        <label for="rating-${item.id}">Rate:</label>
                        <select id="rating-${item.id}" class="item-rating" data-id="${item.id}">
                            <option value="0" ${userRating === 0 ? 'selected' : ''}>No rating</option>
                            <option value="1" ${userRating === 1 ? 'selected' : ''}>1 ★</option>
                            <option value="2" ${userRating === 2 ? 'selected' : ''}>2 ★★</option>
                            <option value="3" ${userRating === 3 ? 'selected' : ''}>3 ★★★</option>
                            <option value="4" ${userRating === 4 ? 'selected' : ''}>4 ★★★★</option>
                            <option value="5" ${userRating === 5 ? 'selected' : ''}>5 ★★★★★</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        itemsGrid.appendChild(itemCard);
    });
    
    // Add event listeners to like buttons
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            toggleLike(itemId);
        });
    });
    
    // Add event listeners to rating selects
    document.querySelectorAll('.item-rating').forEach(select => {
        select.addEventListener('change', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            const rating = parseInt(this.value);
            updateRating(itemId, rating);
        });
    });
}

/**
 * Render the liked items panel
 */
function renderLikedItems() {
    const likedItemsContainer = document.getElementById('liked-items');
    if (!likedItemsContainer) return;
    
    // Clear the container
    likedItemsContainer.innerHTML = '';
    
    if (userState.likedItems.length === 0) {
        likedItemsContainer.innerHTML = '<p class="empty-message">No items liked yet. Click the heart icon on any item to add it here.</p>';
        return;
    }
    
    // Add each liked item
    userState.likedItems.forEach(itemId => {
        const item = items.find(item => item.id === itemId);
        if (!item) return;
        
        const rating = userState.ratings[itemId] || 'No rating';
        
        const likedItem = document.createElement('div');
        likedItem.className = 'liked-item';
        likedItem.innerHTML = `
            <div>
                <div class="liked-item-title">${item.title}</div>
                <div class="liked-item-type">${item.type === 'movie' ? '🎬 Movie' : '📚 Book'}</div>
            </div>
            <div class="liked-item-rating">${rating} ★</div>
        `;
        
        likedItemsContainer.appendChild(likedItem);
    });
}

/**
 * Render content-based recommendations
 */
function renderContentBasedRecommendations() {
    const container = document.getElementById('content-recommendations');
    if (!container) return;
    
    // Clear the container
    container.innerHTML = '';
    
    // Get recommendations
    const recommendations = getContentBasedRecommendations();
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p class="empty-message">Like some items to get content-based recommendations.</p>';
        return;
    }
    
    // Add each recommendation
    recommendations.forEach((rec, index) => {
        const recElement = document.createElement('div');
        recElement.className = 'recommendation-item';
        
        // Format the score as percentage
        const scorePercent = Math.round(rec.score * 100);
        
        // Create explanation text
        let explanationText = '';
        if (rec.matchingTags.length > 0) {
            explanationText = `Matches your interest in: ${rec.matchingTags.join(', ')}`;
        } else {
            explanationText = 'Based on your overall preferences';
        }
        
        recElement.innerHTML = `
            <div class="recommendation-rank">${index + 1}</div>
            <div class="recommendation-content">
                <div class="recommendation-title">${rec.item.title}</div>
                <div class="recommendation-matches">${explanationText}</div>
                <div class="recommendation-type">${rec.item.type === 'movie' ? '🎬 Movie' : '📚 Book'}</div>
            </div>
            <div class="recommendation-score">${scorePercent}%</div>
        `;
        
        container.appendChild(recElement);
    });
}

/**
 * Render collaborative filtering recommendations
 */
function renderCollaborativeRecommendations() {
    const container = document.getElementById('collaborative-recommendations');
    if (!container) return;
    
    // Clear the container
    container.innerHTML = '';
    
    // Get recommendations
    const recommendations = getCollaborativeRecommendations();
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p class="empty-message">Rate some items to get collaborative recommendations.</p>';
        return;
    }
    
    // Add each recommendation
    recommendations.forEach((rec, index) => {
        const recElement = document.createElement('div');
        recElement.className = 'recommendation-item';
        
        // Format the predicted rating
        const predictedRating = rec.predictedRating.toFixed(1);
        
        recElement.innerHTML = `
            <div class="recommendation-rank">${index + 1}</div>
            <div class="recommendation-content">
                <div class="recommendation-title">${rec.item.title}</div>
                <div class="recommendation-prediction">Predicted rating based on similar users</div>
                <div class="recommendation-type">${rec.item.type === 'movie' ? '🎬 Movie' : '📚 Book'}</div>
            </div>
            <div class="recommendation-score">${predictedRating} ★</div>
        `;
        
        container.appendChild(recElement);
    });
}

/**
 * Set up tab functionality
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * Render all components
 */
function renderAll() {
    renderItemsGrid();
    renderLikedItems();
    renderContentBasedRecommendations();
    renderCollaborativeRecommendations();
}

// ============================
// USER INTERACTION HANDLERS
// ============================

/**
 * Toggle like status for an item
 * @param {Number} itemId - ID of the item to toggle
 */
function toggleLike(itemId) {
    const index = userState.likedItems.indexOf(itemId);
    
    if (index === -1) {
        // Add to liked items
        userState.likedItems.push(itemId);
    } else {
        // Remove from liked items
        userState.likedItems.splice(index, 1);
    }
    
    saveUserState();
    renderAll();
}

/**
 * Update rating for an item
 * @param {Number} itemId - ID of the item to rate
 * @param {Number} rating - Rating value (1-5, or 0 to remove rating)
 */
function updateRating(itemId, rating) {
    if (rating === 0) {
        // Remove rating
        delete userState.ratings[itemId];
    } else {
        // Update rating
        userState.ratings[itemId] = rating;
        
        // If rating an item, also add it to liked items if not already there
        if (!userState.likedItems.includes(itemId)) {
            userState.likedItems.push(itemId);
        }
    }
    
    saveUserState();
    renderAll();
}

// ============================
// INITIALIZATION
// ============================

/**
 * Initialize the application
 */
function init() {
    // Load user state from localStorage
    loadUserState();
    
    // Set up event listeners for filters
    document.getElementById('tag-filter').addEventListener('change', renderItemsGrid);
    document.getElementById('type-filter').addEventListener('change', renderItemsGrid);
    
    // Set up reset button
    document.getElementById('reset-btn').addEventListener('click', resetUserState);
    
    // Set up tabs
    setupTabs();
    
    // Initial render
    renderAll();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);