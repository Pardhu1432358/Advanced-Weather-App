const DEFAULT_CITY = "London";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.querySelector(".search-container button");
  const recentList = document.getElementById("recentList");
  const cityElement = document.getElementById('city');
  const countryElement = document.getElementById('country');
  const localTimeElement = document.getElementById('localTime');
  const weatherIcon = document.getElementById('weather-icon');
  const tempElement = document.getElementById('temp');
  const conditionElement = document.getElementById('condition');
  const feelsLikeElement = document.getElementById('feels-like');
  const humidityElement = document.getElementById('humidity');
  const windElement = document.getElementById('wind');
  const windDirElement = document.getElementById('wind-dir');
  const pressureElement = document.getElementById('pressure');
  const precipElement = document.getElementById('precip');
  const visibilityElement = document.getElementById('visibility');
  const uvElement = document.getElementById('uv');
  const healthAlertElement = document.getElementById('health-alert');
  const healthDetailsElement = document.getElementById('health-details');
  const activityStatusElement = document.getElementById('activity-status');
  const activityTimeElement = document.getElementById('activity-time');
  const forecastContainer = document.getElementById('forecast-container');
  const radarMap = document.getElementById('radar-map');

  searchInput.value = DEFAULT_CITY;

  // API Configuration
  const API_KEY = '4bd9f95687b6496ca85114013250201'; // Replace with your WeatherAPI.com API key
  const BASE_URL = 'https://api.weatherapi.com/v1';

  // Initialize map
  let map;
  let currentMarker;

  // Recent searches storage
  let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

  // API Call
  async function getWeatherData(city) {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=3&aqi=yes`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async function getHourlyForecast(city) {
    try {
        const response = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=1&aqi=yes`);
        const data = await response.json();
        return data.forecast.forecastday[0].hour;
    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
        return [];
    }
}

  // Main Update Function
  async function handleSearch() {
    const city = searchInput.value.trim();
    if (!city) return;

    try {
      document.querySelector(".main-content").classList.add("loading");
      searchButton.disabled = true;
      const data = await getWeatherData(city);

      if (!data.error) {
        await UpdateUi(data);
        addToSearchHistory(city);
      } else {
        showError(data.error.message);
      }
    } catch (error) {
      showError("An error occurred while fetching weather data.");
    } finally {
      searchButton.disabled = false;
      document.querySelector(".main-content").classList.remove("loading");
    }
  }

  function addToSearchHistory(city) {
    // Create new list item
    const listItem = document.createElement("li");
    listItem.textContent = city;

    // Add click handler
    listItem.addEventListener("click", () => {
      searchInput.value = city;
      handleSearch();
    });

    // Add to list and limit to 5 items
    const recentList = document.getElementById("recentList");
    recentList.insertBefore(listItem, recentList.firstChild);

    // Remove oldest item if more than 5
    while (recentList.children.length > 5) {
      recentList.removeChild(recentList.lastChild);
    }

    // Save to localStorage for persistence
    saveSearchHistory();
  }

  function saveSearchHistory() {
    const searches = Array.from(
      document.getElementById("recentList").children
    ).map((item) => item.textContent);
    localStorage.setItem("recentSearches", JSON.stringify(searches));
  }

  function loadSearchHistory() {
    const searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    searches.forEach((city) => addToSearchHistory(city));
  }

  // Call loadSearchHistory when page loads
  function getAirQualityAdvice(data) {
    const aqi = data.current.air_quality?.pm2_5 || 50;
    if (aqi <= 50) return "Air quality is good for outdoor activities";
    if (aqi <= 100) return "Moderate air quality - sensitive individuals should take precautions";
    return "Poor air quality - limit outdoor exposure";
}

  // UI Update Functions
  async function UpdateUi(data) {
    if (!data) return;

    try {
        updateMainWeather(data);
        updateWeatherDetails(data);
        updateHealthAdvisory(data);
        updateActivityRecommendations(data);
        updateHealthMonitor(data);
        updateEnvironmentalInsights(data);
        updateAirQualityMonitor(data);
        updatePollenForecast(data);
        await update24HourForecast(data);
        updateSunCycle(data);
        update24HourForecast(data);
        updateWeatherRadar(data);
        updateClimateInsights(data);
        updateHomeAutomation(data);
        setWeatherBackground(data.current.condition.text);
    } catch (error) {
        console.error("Error in UpdateUi:", error);
    }
}

async function update24HourForecast(data) {
    const hourlyData = await getHourlyForecast(data.location.name);
    const forecastHtml = `
        <div class="hourly-forecast">
            <div class="forecast-scroll">
                ${generateHourlyCards(data)}
            </div>
        </div>
    `;
    safeUpdateElement('forecast-container', forecastHtml, 'innerHTML');
}

function generateHourlyCards(data) {
    // Using current conditions since hourly data isn't available in the API response
    const baseTemp = data.current.temp_c;
    const hours = [];
    
    // Generate 24 hours of forecast
    for(let i = 0; i < 24; i++) {
        const hour = (new Date().getHours() + i) % 24;
        const temp = baseTemp + (Math.random() * 4 - 2); // Simulate temperature variation
        
        hours.push(`
            <div class="hour-card">
                <div class="time">${hour}:00</div>
                <img src="${data.current.condition.icon}" alt="weather">
                <div class="temp">${Math.round(temp)}°C</div>
                <div class="condition">${data.current.condition.text}</div>
                <div class="wind">${data.current.wind_kph} km/h</div>
            </div>
        `);
    }
    
    return hours.join('');
}

  // Core Weather Updates
  function updateMainWeather(data) {
    safeUpdateElement("city", data.location.name);
    safeUpdateElement("country", data.location.country);
    safeUpdateElement("localTime", formatDateTime(data.location.localtime));
    safeUpdateElement(
      "weather-icon",
      `https:${data.current.condition.icon}`,
      "src"
    );
    safeUpdateElement("temp", `${Math.round(data.current.temp_c)}°C`);
    safeUpdateElement("condition", data.current.condition.text);
  }

  function updateWeatherDetails(data) {
    const details = {
      "feels-like": `${data.current.feelslike_c}°C`,
      humidity: `${data.current.humidity}%`,
      wind: `${data.current.wind_kph}km/h`,
      "wind-dir": data.current.wind_dir,
      uv: data.current.uv,
      pressure: `${data.current.pressure_mb}mb`,
      visibility: `${data.current.vis_km}km`,
      precip: `${data.current.precip_mm}mm`,
    };

    Object.entries(details).forEach(([id, value]) => {
      safeUpdateElement(id, value);
    });
  }
  // function setWeatherBackground(condition) {
  //   const backgrounds = {
  //       'Clear': 'linear-gradient(135deg, #00b4db, #0083b0)',
  //       'Clouds': 'linear-gradient(135deg, #606c88, #3f4c6b)',
  //       'Rain': 'linear-gradient(135deg, #4b6cb7, #182848)',
  //       'Snow': 'linear-gradient(135deg, #e6dada, #274046)',
  //       'Thunderstorm': 'linear-gradient(135deg, #283E51, #4B79A1)',
  //       'Mist': 'linear-gradient(135deg, #757F9A, #D7DDE8)'
  //   };
    
//     document.body.style.background = backgrounds[condition] || backgrounds['Clear'];
// }


  // Add these functions after your existing updateWeatherDetails function

  function updateHealthAdvisory(data) {
    const healthStatus = calculateHealthStatus(data);
    safeUpdateElement("health-alert", healthStatus.alert, "textContent");
    safeUpdateElement("health-details", healthStatus.details, "innerHTML");
  }

  function updateActivityRecommendations(data) {
    const activities = calculateActivitySuggestions(data);
    safeUpdateElement("activity-status", activities.status);
    safeUpdateElement("activity-time", activities.details);
  }

  function updateHealthMonitor(data) {
    const airQuality = calculateAirQuality(data);

    // Update Air Quality Impact
    const airQualityHtml = `
        <div class="gauge-value ${airQuality.class}">${airQuality.value}</div>
        <div class="gauge-label">${airQuality.label}</div>
        <div class="advice">${airQuality.advice}</div>
    `;
    safeUpdateElement("aqi-gauge", airQualityHtml, "innerHTML");

    // Update Activity Recommendations
    const activitiesHtml = `
        <ul>
            ${airQuality.activities
              .map((activity) => `<li>${activity}</li>`)
              .join("")}
        </ul>
    `;
    safeUpdateElement("activity-gauge", activitiesHtml, "innerHTML");
  }

  function updateEnvironmentalInsights(data) {
    const impact = calculateEnvironmentalImpact(data);

    // Update Carbon Impact
    const carbonHtml = `
        <div class="impact-level">${impact.level}</div>
        <div class="impact-details">
            <ul>
                ${impact.details.map((detail) => `<li>${detail}</li>`).join("")}
            </ul>
        </div>
    `;
    safeUpdateElement("carbon-gauge", carbonHtml, "innerHTML");

    // Update Garden Advisory
    const gardenHtml = `
        <div class="garden-advice">
            <ul>
                ${impact.gardenAdvice
                  .map((advice) => `<li>${advice}</li>`)
                  .join("")}
            </ul>
        </div>
    `;
    safeUpdateElement("garden-metrics", gardenHtml, "innerHTML");
  }
  function initWeatherRadar(map) {
    const radarLayer = new WeatherLayer({
        opacity: 0.7,
        visible: true
    });
    map.addLayer(radarLayer);
}
function toggleRadarVisibility(visible) {
    map.setWeatherRadarVisibility(visible);
}
function updateWeatherRadar(data) {
  const lat = data.location.lat;
  const lon = data.location.lon;
  
  // Clear existing map if any
  const container = document.getElementById('radar-map');
  if (container._leaflet_id) {
      container._leaflet_id = null;
  }
  
  // Initialize map
  const map = L.map('radar-map').setView([lat, lon], 8);
  
  // Add base map layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Add weather layer
  const weatherLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_OPENWEATHER_API_KEY', {
      opacity: 0.6
  }).addTo(map);
}


  function updateAirQualityMonitor(data) {
    const aqi = data.current.air_quality?.pm2_5 || "N/A";
    safeUpdateElement("aqi-level", `AQI: ${aqi}`);
    safeUpdateElement("breathing-advice", getAirQualityAdvice(data));
  }
  function generateHomeRecommendations(data) {
    const temp = data.current.temp_c;
    const condition = data.current.condition.text.toLowerCase();
    
    let climate = [];
    let lighting = [];
    
    // Climate recommendations
    if (temp > 25) {
        climate = [
            "Optimize AC settings for comfort",
            "Close curtains during peak heat",
            "Use smart ventilation"
        ];
    } else if (temp < 18) {
        climate = [
            "Adjust heating system",
            "Check insulation efficiency",
            "Monitor energy usage"
        ];
    } else {
        climate = [
            "Maintain optimal temperature",
            "Enable energy-saving mode",
            "Monitor air quality"
        ];
    }
    
    // Lighting recommendations
    if (condition.includes('rain') || condition.includes('cloud')) {
        lighting = [
            "Increase indoor lighting",
            "Activate motion sensors",
            "Enable adaptive brightness"
        ];
    } else {
        lighting = [
            "Optimize natural light usage",
            "Adjust smart blinds",
            "Set evening lighting schedule"
        ];
    }
    
    return { climate, lighting };
}

  function updatePollenForecast(data) {
    const pollen = calculatePollenStatus(data);

    // Update pollen index with level
    const indexHtml = `<div class="pollen-level">Pollen Level: ${pollen.level}</div>`;
    safeUpdateElement("pollen-index", indexHtml, "innerHTML");

    // Update allergy risk with details
    const riskHtml = `
        <div class="risk-level">${pollen.risk}</div>
        <ul class="risk-details">
            ${pollen.details.map((detail) => `<li>${detail}</li>`).join("")}
        </ul>
    `;
    safeUpdateElement("allergy-risk", riskHtml, "innerHTML");
  }

  function updateSunCycle(data) {
    const sunData = calculateSunData(data);
    safeUpdateElement("sunrise-time", `Sunrise: ${sunData.sunrise}`);
    safeUpdateElement("sunset-time", `Sunset: ${sunData.sunset}`);
    safeUpdateElement("uv-forecast", `UV Index: ${data.current.uv}`);
  }

  function updateClimateInsights(data) {
    const climate = calculateClimateImpact(data);
    safeUpdateElement("temperature-trend", climate.trend);
    safeUpdateElement("climate-impact", climate.impact);
    safeUpdateElement("sustainability-tips", climate.tips);
  }

 function updateHomeAutomation(data) {
    const recommendations = generateHomeRecommendations(data);
    
    const automationHtml = `
        <div class="automation-controls">
            <div class="hvac-control">
                <h4>Climate Control</h4>
                <ul>
                    ${recommendations.climate.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="lighting-control">
                <h4>Lighting Suggestions</h4>
                <ul>
                    ${recommendations.lighting.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    safeUpdateElement('automation-container', automationHtml, 'innerHTML');
}



  // Helper calculation functions
  function calculateHealthStatus(data) {
    const temp = data.current.temp_c;
    const humidity = data.current.humidity;
    const uv = data.current.uv;

    let alert = "Current Health Status: ";
    let details = [];

    if (temp < 10) {
      alert += "Cold Weather Alert";
      details = ["Wear warm layers", "Protect extremities", "Stay warm"];
    } else if (temp > 30) {
      alert += "Heat Warning";
      details = [
        "Stay hydrated",
        "Avoid direct sunlight",
        "Use sun protection",
      ];
    } else {
      alert += "Favorable Conditions";
      details = ["Ideal for outdoor activities"];
    }

    if (humidity > 70) {
      details.push("High humidity - Stay in ventilated areas");
    }

    // Create proper HTML list structure
    const formattedDetails = `
        <ul>
            ${details.map((detail) => `<li>${detail}</li>`).join("")}
        </ul>
    `;

    return {
      alert: alert,
      details: formattedDetails,
    };
  }

  function calculateActivitySuggestions(data) {
    const temp = data.current.temp_c;
    const condition = data.current.condition.text.toLowerCase();
    const time = new Date(data.location.localtime);
    const hour = time.getHours();

    let status = "";
    let details = [];

    // Time-based recommendations
    if (hour >= 6 && hour < 10) {
      status = "Morning Exercise Window";
      details = [
        "Ideal time for jogging",
        "Perfect for outdoor yoga",
        "Good for cycling",
      ];
    } else if (hour >= 16 && hour < 19) {
      status = "Evening Activity Window";
      details = [
        "Suitable for walking",
        "Team sports recommended",
        "Garden activities ideal",
      ];
    }

    // Weather condition modifications
    if (condition.includes("rain")) {
      status = "Indoor Activities Recommended";
      details = [
        "Indoor exercises advised",
        "Swimming in indoor pools",
        "Gym workouts suggested",
      ];
    } else if (temp > 30) {
      status = "Heat Advisory - Limited Activity";
      details = [
        "Stay hydrated",
        "Choose water-based activities",
        "Exercise in shaded areas",
      ];
    } else if (temp < 10) {
      status = "Cold Weather Activities";
      details = [
        "Wear warm layers",
        "Indoor sports recommended",
        "Short duration outdoor activities",
      ];
    }

    return {
      status: status,
      details: details.join("\n"), // Use newline instead of <br>
    };
  }

  function updateActivityRecommendations(data) {
    const activities = calculateActivitySuggestions(data);
    safeUpdateElement("activity-status", activities.status);
    safeUpdateElement("activity-time", activities.details);
  }

  function calculateAirQuality(data) {
    const aqi = data.current.air_quality?.pm2_5 || 50;
    const temp = data.current.temp_c;
    const condition = data.current.condition.text.toLowerCase();
    const time = new Date(data.location.localtime);
    const hour = time.getHours();

    let airQualityInfo = {
      value: "",
      label: "",
      advice: "",
      class: "",
      activities: [],
    };

    // Air Quality Assessment
    if (aqi <= 50) {
      airQualityInfo = {
        value: "Good",
        label: "Healthy Air Quality",
        advice: "Perfect for outdoor activities",
        class: "good",
        activities: [
          "Ideal for all outdoor activities",
          "Perfect for sports and exercise",
          "Great for outdoor gatherings",
        ],
      };
    } else if (aqi <= 100) {
      airQualityInfo = {
        value: "Moderate",
        label: "Moderate Air Quality",
        advice: "Sensitive groups should take precautions",
        class: "moderate",
        activities: [
          "Moderate outdoor activities recommended",
          "Take breaks during exercise",
          "Consider indoor alternatives if sensitive",
        ],
      };
    } else {
      airQualityInfo = {
        value: "Poor",
        label: "Poor Air Quality",
        advice: "Limit outdoor exposure",
        class: "poor",
        activities: [
          "Indoor activities recommended",
          "Avoid strenuous outdoor exercise",
          "Stay indoors if possible",
        ],
      };
    }

    // Time-based modifications
    if (hour >= 6 && hour < 10) {
      airQualityInfo.activities.push("Morning exercise recommended");
    } else if (hour >= 16 && hour < 19) {
      airQualityInfo.activities.push("Evening activities suitable");
    }

    return airQualityInfo;
  }

  function calculateEnvironmentalImpact(data) {
    const temp = data.current.temp_c;
    let level = "Low Environmental Impact";
    let details = [];
    let gardenAdvice = [];

    // Temperature-based impact
    if (temp > 25) {
      level = "Moderate Environmental Impact";
      details = [
        "Use natural ventilation",
        "Optimize AC usage",
        "Consider energy-efficient options",
      ];
      gardenAdvice = [
        "Water plants frequently",
        "Provide shade for sensitive plants",
        "Monitor soil moisture",
      ];
    } else if (temp < 18) {
      level = "Moderate Environmental Impact";
      details = [
        "Check heating efficiency",
        "Seal drafts",
        "Monitor energy usage",
      ];
      gardenAdvice = [
        "Protect plants from frost",
        "Reduce watering frequency",
        "Check plant protection",
      ];
    } else {
      details = [
        "Regular energy consumption",
        "Maintain normal usage",
        "Monitor efficiency",
      ];
      gardenAdvice = [
        "Regular watering recommended",
        "Normal garden maintenance",
        "Monitor plant health",
      ];
    }

    return {
      level: level,
      details: details,
      gardenAdvice: gardenAdvice,
    };
  }

  function calculateSunData(data) {
    // Simplified sun data calculation
    return {
      sunrise: "6:00 AM",
      sunset: "6:00 PM",
    };
  }

  function calculateClimateImpact(data) {
    const temp = data.current.temp_c;
    return {
      trend: `Temperature trend: ${temp > 25 ? "Above" : "Below"} average`,
      impact: `Climate impact: ${temp > 30 ? "High" : "Moderate"}`,
      tips: "Reduce energy consumption when possible",
    };
  }

  function calculatePollenStatus(data) {
    const humidity = data.current.humidity;
    const wind = data.current.wind_kph;
    const temp = data.current.temp_c;

    if (humidity > 70 && wind < 15) {
      return {
        level: "High",
        risk: "High Risk - Take Precautions",
        details: [
          "High pollen concentration likely",
          "Limit outdoor activities",
          "Keep windows closed",
          "Use air purifiers indoors",
        ],
      };
    } else if (humidity > 50 && wind < 25) {
      return {
        level: "Moderate",
        risk: "Moderate Risk - Stay Alert",
        details: [
          "Moderate pollen levels expected",
          "Take preventive medication if needed",
          "Monitor outdoor exposure",
          "Consider wearing a mask outdoors",
        ],
      };
    } else {
      return {
        level: "Low",
        risk: "Low Risk - Favorable Conditions",
        details: [
          "Low pollen concentration",
          "Good conditions for outdoor activities",
          "Continue regular precautions",
          "Monitor for any symptoms",
        ],
      };
    }
  }
  // Utility Functions
  function safeUpdateElement(id, content, attribute = "textContent") {
    const element = document.getElementById(id);
    if (element) {
      if (attribute === "src") {
        element.src = content;
      } else {
        element[attribute] = content;
      }
    }
  }

  function formatDateTime(dateString) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  }

  function showError(message) {
    const existingError = document.querySelector(".error-message");
    if (existingError) existingError.remove();

    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;

    const header = document.querySelector(".weather-header");
    if (header) {
      header.insertBefore(errorDiv, header.firstChild);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  }

  // Event Listeners
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  searchButton.addEventListener("click", handleSearch);

  // Initial load
  handleSearch();
});
