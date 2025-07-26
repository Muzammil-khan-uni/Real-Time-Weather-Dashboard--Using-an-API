#  Real-Time Weather Dashboard  Using an API

[![IMAGE ALT TEXT HERE](https://github.com/Muzammil-khan-uni/Real-Time-Weather-Dashboard--Using-an-API/blob/main/Screenshot%202025-07-26%20063600.png)](https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7354682119987634178?compact=1)


WeatherSphere is a fully responsive, real-time weather dashboard that allows users to search for weather updates across the globe, view 3-day forecasts, and receive smart weather tips. Built using vanilla JavaScript and OpenWeatherMap API, the app combines modern UI/UX principles with practical asynchronous JavaScript operations and API integration.

<h1>📌 Key Features</h1>
<h2>1. 🔍 Search by City</h2>
Users can type and search any city globally.

Weather data is fetched using the OpenWeatherMap Geocoding and Weather endpoints.

Search history is stored in localStorage and displayed as "Recent Cities."

<h2>2. 📍 Use My Location</h2>
Uses the Geolocation API to detect the user’s current location.

Automatically fetches weather and displays relevant info without manual input.

<h2>3. ⛅ Real-Time Weather Data</h2>
Current weather shows:

Temperature

Humidity

Wind Speed

Visibility

Pressure

Sunrise & Sunset

Feels Like Temperature

Includes weather icon and dynamic description.

<h2>4. 📆 3-Day Forecast</h2>
Forecasted data is dynamically extracted and averaged from the OpenWeatherMap 3-hour interval forecast.

Displays:

High & low temperatures

Weather icon

Day & Date

<h2>5. 💡 Weather-Based Tips</h2>
Smart tips are shown based on current weather conditions (sunny, rainy, snowy, etc.)

Icons and advice offer a better user experience and guidance.

<h2>6. 🎨 Modern UI</h2>
Clean, minimal, and responsive glassmorphism design.

Dynamic backgrounds based on weather type:

☀️ Sunny

🌧️ Rainy

☁️ Cloudy

❄️ Snowy

⛈️ Thunderstorm

Fully optimized for desktop, tablet, and mobile screens.

<h2>7. ⚙️ Auto-Refresh</h2>
Automatically updates the weather data every 15 minutes if the city has been previously searched.

<h2>🧠 Covered Concepts</h2>
API Integration

Asynchronous JavaScript (async/await)

Error Handling & Validation

DOM Manipulation

Event Handling

Geolocation API

Local Storage

Responsive Web Design

<h2>🏆 Bonus Features</h2>

Offline detection with custom error message.

Intelligent weather tips to enhance user awareness.

Reusable utility functions to clean and modularize code.


