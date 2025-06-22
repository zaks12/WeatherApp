// DOM elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const locationElement = document.getElementById('location');
const dateElement = document.getElementById('date');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const weatherIconElement = document.getElementById('weather-icon');
const windElement = document.getElementById('wind');
const humidityElement = document.getElementById('humidity');
const forecastContainer = document.getElementById('forecast-container');

// Default city
let currentCity = 'London';

// Event listeners
searchBtn.addEventListener('click', () => {
    if (locationInput.value.trim() !== '') {
        currentCity = locationInput.value.trim();
        getLocationKey(currentCity);
    }
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && locationInput.value.trim() !== '') {
        currentCity = locationInput.value.trim();
        getLocationKey(currentCity);
    }
});

// Format date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Change background based on weather
function changeBackground(weatherText) {
    let backgroundImage;
    
    // Map AccuWeather text to background images
    if (weatherText.includes('Clear') || weatherText.includes('Sunny')) {
        backgroundImage = 'clear.jpg';
    } else if (weatherText.includes('Rain') || weatherText.includes('Shower') || weatherText.includes('Thunderstorm')) {
        backgroundImage = 'rain.jpg';
    } else if (weatherText.includes('Snow') || weatherText.includes('Ice') || weatherText.includes('Sleet')) {
        backgroundImage = 'snow.jpg';
    } else if (weatherText.includes('Fog') || weatherText.includes('Mist') || weatherText.includes('Haze')) {
        backgroundImage = 'mist.jpg';
    } else {
        backgroundImage = 'clouds.jpg';
    }
    
    document.body.style.backgroundImage = `url('images/${backgroundImage}')`;
}

// Get location key for a city
async function getLocationKey(city) {
    try {
        console.log(`Searching for city: ${city}`);
        
        // URL encode the city name to handle spaces and special characters
        const encodedCity = encodeURIComponent(city);
        
        const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${API_KEY}&q=${encodedCity}`;
        console.log('Location API URL:', locationUrl);
        
        const locationResponse = await fetch(locationUrl);
        
        console.log('Location API response status:', locationResponse.status);
        
        if (!locationResponse.ok) {
            throw new Error(`Location search failed: ${locationResponse.status}`);
        }
        
        const locationData = await locationResponse.json();
        console.log('Location data received:', locationData);
        
        if (!locationData || locationData.length === 0) {
            throw new Error(`City "${city}" not found. Please check spelling or try another city.`);
        }
        
        const location = locationData[0];
        const locationKey = location.Key;
        const formattedLocation = `${location.LocalizedName}, ${location.Country.LocalizedName}`;
        
        console.log(`Found location key: ${locationKey} for ${formattedLocation}`);
        
        // Get current conditions and forecast using location key
        await Promise.all([
            getCurrentConditions(locationKey, formattedLocation),
            getForecast(locationKey)
        ]);
        
    } catch (error) {
        console.error('Error getting location key:', error);
        alert(error.message || 'City not found. Please try another city.');
    }
}

// Get current weather conditions
async function getCurrentConditions(locationKey, locationName) {
    try {
        console.log(`Fetching current conditions for location key: ${locationKey}`);
        
        const currentUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`;
        console.log('Current conditions API URL:', currentUrl);
        
        const currentResponse = await fetch(currentUrl);
        
        console.log('Current conditions API response status:', currentResponse.status);
        
        if (!currentResponse.ok) {
            throw new Error(`Current conditions request failed: ${currentResponse.status}`);
        }
        
        const currentData = await currentResponse.json();
        console.log('Current conditions data received:', currentData);
        
        if (!currentData || currentData.length === 0) {
            throw new Error('Current weather data not available');
        }
        
        // Update UI with current weather
        updateCurrentWeather(currentData[0], locationName);
        
    } catch (error) {
        console.error('Error fetching current conditions:', error);
        alert(error.message || 'Weather data not available. Please try again later.');
    }
}

// Get 5-day forecast
async function getForecast(locationKey) {
    try {
        console.log(`Fetching 5-day forecast for location key: ${locationKey}`);
        
        const forecastUrl = `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${API_KEY}&metric=true`;
        console.log('Forecast API URL:', forecastUrl);
        
        const forecastResponse = await fetch(forecastUrl);
        
        console.log('Forecast API response status:', forecastResponse.status);
        
        if (!forecastResponse.ok) {
            throw new Error(`Forecast request failed: ${forecastResponse.status}`);
        }
        
        const forecastData = await forecastResponse.json();
        console.log('Forecast data received:', forecastData);
        
        // Update UI with forecast
        updateForecast(forecastData);
        
    } catch (error) {
        console.error('Error fetching forecast:', error);
        alert(error.message || 'Forecast data not available. Please try again later.');
    }
}

// Update current weather in UI
function updateCurrentWeather(data, locationName) {
    locationElement.textContent = locationName;
    dateElement.textContent = formatDate(new Date());
    
    // Temperature in Celsius
    temperatureElement.textContent = `${Math.round(data.Temperature.Metric.Value)}°C`;
    
    // Weather description
    descriptionElement.textContent = data.WeatherText;
    
    // Weather icon (AccuWeather uses numbers for icons)
    const iconCode = data.WeatherIcon.toString().padStart(2, '0');
    weatherIconElement.src = `https://developer.accuweather.com/sites/default/files/${iconCode}-s.png`;
    
    // Wind speed (convert to km/h if needed)
    windElement.textContent = `${Math.round(data.Wind.Speed.Metric.Value)} km/h`;
    
    // Humidity
    humidityElement.textContent = `${data.RelativeHumidity}%`;
    
    // Change background based on weather
    changeBackground(data.WeatherText);
}

// Update forecast in UI
function updateForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Process each day in the forecast
    data.DailyForecasts.forEach(forecast => {
        const date = new Date(forecast.Date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const tempMax = Math.round(forecast.Temperature.Maximum.Value);
        const tempMin = Math.round(forecast.Temperature.Minimum.Value);
        const iconCode = forecast.Day.Icon.toString().padStart(2, '0');
        const description = forecast.Day.IconPhrase;
        
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        forecastItem.innerHTML = `
            <h4>${dayName}</h4>
            <img src="https://developer.accuweather.com/sites/default/files/${iconCode}-s.png" alt="Weather Icon">
            <p>${tempMax}°C / ${tempMin}°C</p>
            <p>${description}</p>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Initialize app with default city
window.addEventListener('load', () => {
    console.log('App initialized with default city:', currentCity);
    getLocationKey(currentCity);
});
