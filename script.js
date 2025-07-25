const API_KEY = 'Paste Your API here';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEOCODE_URL = 'https://api.openweathermap.org/geo/1.0';
const ICON_URL = 'https://openweathermap.org/img/wn/';

// DOM Elements
const citySearch = document.getElementById('city-search');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loadingElement = document.getElementById('loading');
const skeletonLoader = document.getElementById('skeleton-loader');
const currentWeatherElement = document.getElementById('current-weather');
const forecastElement = document.getElementById('forecast');
const recentCitiesElement = document.getElementById('recent-cities');
const weatherTipsElement = document.getElementById('weather-tips');
const unitButtons = document.querySelectorAll('.unit-btn');
const refreshBtn = document.getElementById('refresh-btn');
const feedbackBtn = document.getElementById('feedback-btn');
const feedbackModal = document.getElementById('feedback-modal');
const closeModal = document.querySelector('.close-modal');
const feedbackForm = document.getElementById('feedback-form');
const autocompleteResults = document.getElementById('autocomplete-results');

// State
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
let currentUnit = 'celsius';
let lastSearchedCity = '';
let debounceTimeout;

const weatherTips = {
    sunny: [
        {
            icon: 'fa-sun',
            title: 'Sun Protection',
            content: 'Wear sunscreen with at least SPF 30 and sunglasses to protect from UV rays.'
        },
        {
            icon: 'fa-bottle-water',
            title: 'Stay Hydrated',
            content: 'Drink plenty of water to avoid dehydration in sunny weather.'
        }
    ],
    rainy: [
        {
            icon: 'fa-umbrella',
            title: 'Carry an Umbrella',
            content: 'Keep an umbrella handy to stay dry during unexpected showers.'
        },
        {
            icon: 'fa-car',
            title: 'Drive Safely',
            content: 'Wet roads can be slippery. Drive carefully and maintain safe distances.'
        }
    ],
    cloudy: [
        {
            icon: 'fa-cloud',
            title: 'Layer Up',
            content: 'Wear layers that you can easily remove if the sun comes out.'
        },
        {
            icon: 'fa-cloud-sun',
            title: 'Be Prepared',
            content: 'Cloudy skies can change quickly. Check the forecast regularly.'
        }
    ],
    snowy: [
        {
            icon: 'fa-snowflake',
            title: 'Winter Gear',
            content: 'Wear warm clothing, gloves, and boots to stay warm and dry.'
        },
        {
            icon: 'fa-icicles',
            title: 'Watch Your Step',
            content: 'Be cautious of icy patches on sidewalks and roads.'
        }
    ],
    thunderstorm: [
        {
            icon: 'fa-bolt',
            title: 'Stay Indoors',
            content: 'Avoid going outside during thunderstorms for your safety.'
        },
        {
            icon: 'fa-house',
            title: 'Unplug Devices',
            content: 'Unplug electrical appliances to protect them from power surges.'
        }
    ],
    default: [
        {
            icon: 'fa-cloud-sun',
            title: 'Weather Changes',
            content: 'Check the forecast regularly as weather conditions can change quickly.'
        },
        {
            icon: 'fa-temperature-high',
            title: 'Dress Appropriately',
            content: 'Wear suitable clothing for the current temperature and conditions.'
        }
    ]
};


// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateRecentCities();
    
    // Set initial unit mode
    document.body.classList.add('celsius-mode');
    
    // Load last searched city or default
    if (recentCities.length > 0) {
        lastSearchedCity = recentCities[0];
        fetchWeather(lastSearchedCity);
    } else {
        fetchWeather('London');
    }
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleLocation);
    citySearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    citySearch.addEventListener('input', handleAutocomplete);
    
    unitButtons.forEach(btn => {
        btn.addEventListener('click', () => handleUnitChange(btn));
    });
    
    refreshBtn.addEventListener('click', handleRefresh);
    feedbackBtn.addEventListener('click', showFeedbackModal);
    closeModal.addEventListener('click', hideFeedbackModal);
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            hideFeedbackModal();
        }
    });
    
    // Auto-refresh every 15 minutes
    setInterval(() => {
        if (lastSearchedCity) {
            fetchWeather(lastSearchedCity);
        }
    }, 15 * 60 * 1000);
});

// Search functions
function handleSearch() {
    const city = citySearch.value.trim();
    if (city) {
        fetchWeather(city);
        citySearch.value = '';
        hideAutocomplete();
    }
}

function handleLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                hideLoading();
                showError('Unable to retrieve your location');
                console.error('Geolocation error:', error);
            },
            { enableHighAccuracy: true }
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

function handleRefresh() {
    if (lastSearchedCity) {
        fetchWeather(lastSearchedCity);
    }
}

// Weather data fetching
async function fetchWeather(city) {
    try {
        showSkeletonLoader();
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const geoResponse = await fetch(`${GEOCODE_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`);
        
        if (!geoResponse.ok) {
            throw new Error('City not found');
        }
        
        const geoData = await geoResponse.json();
        if (!geoData.length) {
            throw new Error('City not found');
        }
        
        const { lat, lon, name, country } = geoData[0];
        const locationName = `${name}, ${country}`;
        lastSearchedCity = locationName;
        
        addRecentCity(locationName);
        
        const [currentWeather, forecast] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
        ]);
        
        if (!currentWeather.ok || !forecast.ok) {
            throw new Error('Weather data not available');
        }
        
        const currentData = await currentWeather.json();
        const forecastData = await forecast.json();
        
        displayCurrentWeather(currentData, locationName);
        displayForecast(forecastData);
        displayWeatherTips(currentData.weather[0].main.toLowerCase());
        hideSkeletonLoader();
    } catch (error) {
        hideSkeletonLoader();
        showError(error.message);
        console.error('Error fetching weather data:', error);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        showSkeletonLoader();

        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const geoResponse = await fetch(
            `${GEOCODE_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );
        
        if (!geoResponse.ok) {
            throw new Error('Location not found');
        }
        
        const geoData = await geoResponse.json();
        if (!geoData.length) {
            throw new Error('No location data found');
        }
        
        const location = geoData[0];
        const cityName = getProperCityName(location);
        const countryCode = location.country;
        const displayName = `${cityName}, ${countryCode}`;
        lastSearchedCity = displayName;
        
        addRecentCity(displayName);
        
        const [currentWeather, forecast] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
        ]);
        
        if (!currentWeather.ok || !forecast.ok) {
            throw new Error('Weather data not available');
        }
        
        const currentData = await currentWeather.json();
        const forecastData = await forecast.json();
        
        displayCurrentWeather(currentData, displayName);
        displayForecast(forecastData);
        displayWeatherTips(currentData.weather[0].main.toLowerCase());
        hideSkeletonLoader();
    } catch (error) {
        hideSkeletonLoader();
        showError(error.message);
        console.error('Error fetching location data:', error);
    }
}

// Autocomplete functionality
async function handleAutocomplete() {
    const query = citySearch.value.trim();
    
    if (query.length < 2) {
        hideAutocomplete();
        return;
    }
    
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${GEOCODE_URL}/direct?q=${query}&limit=5&appid=${API_KEY}`);
            const data = await response.json();
            
            if (data.length > 0) {
                showAutocomplete(data);
            } else {
                hideAutocomplete();
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            hideAutocomplete();
        }
    }, 300);
}

function showAutocomplete(results) {
    autocompleteResults.innerHTML = '';
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = `${result.name}, ${result.country}`;
        item.addEventListener('click', () => {
            citySearch.value = `${result.name}, ${result.country}`;
            hideAutocomplete();
        });
        autocompleteResults.appendChild(item);
    });
    
    autocompleteResults.style.display = 'block';
}

function hideAutocomplete() {
    autocompleteResults.style.display = 'none';
}

// Display functions
function displayCurrentWeather(data, customLocation = null) {
    const date = new Date(data.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const time = new Date(data.dt * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const locationName = customLocation || `${data.name}, ${data.sys.country}`;
    const weatherIcon = data.weather[0].icon.replace('n', 'd');
    let temp = Math.round(data.main.temp);
    let feelsLike = Math.round(data.main.feels_like);
    
    if (currentUnit === 'fahrenheit') {
        temp = celsiusToFahrenheit(temp);
        feelsLike = celsiusToFahrenheit(feelsLike);
    }
    
    const humidity = data.main.humidity;
    const windSpeed = currentUnit === 'fahrenheit' 
        ? (data.wind.speed * 2.237).toFixed(1) // Convert to mph
        : (data.wind.speed * 3.6).toFixed(1);  // Convert to km/h
    const pressure = data.main.pressure;
    const visibility = currentUnit === 'fahrenheit'
        ? (data.visibility / 1609).toFixed(1) // Convert to miles
        : (data.visibility / 1000).toFixed(1); // Convert to km
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    setWeatherBackground(data.weather[0].main.toLowerCase());
    
    currentWeatherElement.innerHTML = `
        <div class="current-header">
            <div>
                <div class="current-city">${locationName}</div>
                <div class="current-date">${date} • ${time}</div>
            </div>
            <div class="weather-description">
                <i class="fas ${getWeatherIcon(data.weather[0].id)}"></i>
                ${data.weather[0].description}
            </div>
        </div>
        <div class="current-main">
            <div class="current-temp">${temp}</div>
            <img class="current-weather-icon" src="${ICON_URL}${weatherIcon}@4x.png" alt="${data.weather[0].description}">
        </div>
        <div class="current-details">
            <div class="detail-item">
                <i class="fas fa-temperature-low"></i>
                <div>
                    <span class="detail-label">Feels like</span>
                    <span class="detail-value feels-like-temp">${feelsLike}</span>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <div>
                    <span class="detail-label">Humidity</span>
                    <span class="detail-value">${humidity}%</span>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <div>
                    <span class="detail-label">Wind</span>
                    <span class="detail-value">${windSpeed} ${currentUnit === 'celsius' ? 'km/h' : 'mph'}</span>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-tachometer-alt"></i>
                <div>
                    <span class="detail-label">Pressure</span>
                    <span class="detail-value">${pressure} hPa</span>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-eye"></i>
                <div>
                    <span class="detail-label">Visibility</span>
                    <span class="detail-value">${visibility} ${currentUnit === 'celsius' ? 'km' : 'mi'}</span>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <div>
                    <span class="detail-label">Sunrise</span>
                    <span class="detail-value">${sunrise}</span>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-moon"></i>
                <div>
                    <span class="detail-label">Sunset</span>
                    <span class="detail-value">${sunset}</span>
                </div>
            </div>
        </div>
    `;
    
    currentWeatherElement.style.display = 'block';
}

function displayForecast(data) {
    const dailyForecast = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyForecast[date]) {
            dailyForecast[date] = [];
        }
        dailyForecast[date].push(item);
    });

    const forecastDates = Object.keys(dailyForecast).slice(1, 6);

    let forecastHTML = `
        <h3 class="forecast-title">
            <i class="fas fa-calendar-alt"></i> Next Days Forecast
        </h3>
        <div class="forecast-cards">
    `;

    forecastDates.forEach(date => {
        const dayData = dailyForecast[date];
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        const dayDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const temps = dayData.map(item => item.main.temp);
        let high = Math.round(Math.max(...temps));
        let low = Math.round(Math.min(...temps));

        if (currentUnit === 'fahrenheit') {
            high = celsiusToFahrenheit(high);
            low = celsiusToFahrenheit(low);
        }

        const weatherCounts = {};
        dayData.forEach(item => {
            const condition = item.weather[0].main;
            weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
        });
        const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) =>
            weatherCounts[a] > weatherCounts[b] ? a : b
        );
        const representativeItem = dayData.find(item => item.weather[0].main === mostCommonWeather);
        const weatherIcon = representativeItem.weather[0].icon.replace('n', 'd');
        const weatherDescription = representativeItem.weather[0].description;

        forecastHTML += `
            <div class="forecast-card">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${dayDate}</div>
                <img class="forecast-icon" 
                     src="${ICON_URL}${weatherIcon}@2x.png" 
                     alt="${weatherDescription}" 
                     title="${weatherDescription}">
                <div class="forecast-temp">
                    <span class="forecast-high">${high}</span>
                    <span class="forecast-low">${low}</span>
                </div>
            </div>
        `;
    });

    forecastHTML += '</div>';
    forecastElement.innerHTML = forecastHTML;
    forecastElement.style.display = 'block';
}

function displayWeatherTips(weatherCondition) {
    let tips = weatherTips[weatherCondition] || weatherTips.default;
    
    if (tips.length < 2) {
        const availableDefaultTips = weatherTips.default.filter(defaultTip => 
            !tips.some(tip => tip.title === defaultTip.title)
        );
        
        const neededTips = 2 - tips.length;
        tips = [...tips, ...availableDefaultTips.slice(0, neededTips)];
    }
    
    tips = tips.slice(0, 2);
    
    let tipsHTML = `
        <h3>
            <i class="fas fa-lightbulb"></i> Weather Tips
        </h3>
    `;
    
    tips.forEach(tip => {
        tipsHTML += `
            <div class="tip-card">
                <div class="tip-title">
                    <i class="fas ${tip.icon}"></i>
                    ${tip.title}
                </div>
                <div class="tip-content">${tip.content}</div>
            </div>
        `;
    });
    
    weatherTipsElement.innerHTML = tipsHTML;
}

// Helper functions
function getProperCityName(location) {
    if (location.name) return location.name;

    if (location.local_names && location.local_names.en) {
        return location.local_names.en;
    }
    return `${location.lat}, ${location.lon}`;
}

function celsiusToFahrenheit(celsius) {
    return Math.round((celsius * 9/5) + 32);
}

function setWeatherBackground(weatherCondition) {
    const appContainer = document.querySelector('.app-container');
    
    appContainer.classList.remove(
        'weather-sunny', 'weather-rainy', 
        'weather-cloudy', 'weather-snowy',
        'weather-thunderstorm', 'weather-clear'
    );
    
    switch(weatherCondition) {
        case 'clear':
            appContainer.classList.add('weather-sunny');
            break;
        case 'rain':
        case 'drizzle':
            appContainer.classList.add('weather-rainy');
            break;
        case 'clouds':
            appContainer.classList.add('weather-cloudy');
            break;
        case 'snow':
            appContainer.classList.add('weather-snowy');
            break;
        case 'thunderstorm':
            appContainer.classList.add('weather-thunderstorm');
            break;
        default:
            appContainer.classList.add('weather-clear');
    }
}

function getWeatherIcon(weatherId) {
    if (weatherId >= 200 && weatherId < 300) {
        return 'fa-bolt';
    } else if (weatherId >= 300 && weatherId < 400) {
        return 'fa-cloud-rain';
    } else if (weatherId >= 500 && weatherId < 600) {
        return 'fa-umbrella';
    } else if (weatherId >= 600 && weatherId < 700) {
        return 'fa-snowflake';
    } else if (weatherId >= 700 && weatherId < 800) {
        return 'fa-smog';
    } else if (weatherId === 800) {
        return 'fa-sun';
    } else if (weatherId > 800) {
        return 'fa-cloud';
    } else {
        return 'fa-cloud-sun';
    }
}

// Recent cities functions
function addRecentCity(city) {
    recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());

    recentCities.unshift(city);

    if (recentCities.length > 5) recentCities.pop();

    localStorage.setItem('recentCities', JSON.stringify(recentCities));
    updateRecentCities();
}

function updateRecentCities() {
    recentCitiesElement.innerHTML = '';
    recentCities.forEach(city => {
        const cityItem = document.createElement('div');
        cityItem.className = 'recent-city';
        cityItem.innerHTML = `<i class="fas fa-clock"></i> ${city}`;
        cityItem.addEventListener('click', () => fetchWeather(city));
        recentCitiesElement.appendChild(cityItem);
    });
}

// Unit conversion
function handleUnitChange(btn) {
    if (btn.classList.contains('active')) return;
    
    currentUnit = btn.dataset.unit;
    
    unitButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update body classes for unit display
    document.body.classList.remove('celsius-mode', 'fahrenheit-mode');
    document.body.classList.add(`${currentUnit}-mode`);
    
    if (lastSearchedCity) {
        fetchWeather(lastSearchedCity.split(',')[0]);
    }
}

// Loading states
function showLoading() {
    loadingElement.style.display = 'block';
    currentWeatherElement.style.display = 'none';
    forecastElement.style.display = 'none';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

function showSkeletonLoader() {
    skeletonLoader.style.display = 'block';
    currentWeatherElement.style.display = 'none';
    forecastElement.style.display = 'none';
    loadingElement.style.display = 'none';
}

function hideSkeletonLoader() {
    skeletonLoader.style.display = 'none';
}

// Error handling
function showError(message) {
    currentWeatherElement.style.display = 'none';
    forecastElement.style.display = 'none';
    hideSkeletonLoader();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
        <button class="retry-btn">Retry</button>
    `;
    
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    errorElement.querySelector('.retry-btn').addEventListener('click', () => {
        if (recentCities.length > 0) {
            fetchWeather(recentCities[0]);
        }
    });
    
    document.querySelector('.weather-content').prepend(errorElement);
}

window.addEventListener('offline', () => {
    showError('You are offline. Please check your connection.');
});

// Feedback modal
function showFeedbackModal() {
    feedbackModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideFeedbackModal() {
    feedbackModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('feedback-email').value;
    const message = document.getElementById('feedback-message').value;
    
    // In a real app, you would send this to your backend
    console.log('Feedback submitted:', { email, message });
    
    // Show thank you message
    const form = e.target;
    form.innerHTML = `
        <div class="feedback-thankyou">
            <i class="fas fa-check-circle"></i>
            <h3>Thank You!</h3>
            <p>Your feedback has been received.</p>
            <button type="button" class="submit-btn" onclick="hideFeedbackModal()">Close</button>
        </div>
    `;
    
    // Reset form after 3 seconds
    setTimeout(() => {
        form.reset();
        form.innerHTML = `
            <div class="form-group">
                <label for="feedback-email">Email (optional)</label>
                <input type="email" id="feedback-email" placeholder="Your email">
            </div>
            <div class="form-group">
                <label for="feedback-message">Message</label>
                <textarea id="feedback-message" placeholder="Your feedback..." required></textarea>
            </div>
            <button type="submit" class="submit-btn">Submit</button>
        `;
    }, 3000);
}
