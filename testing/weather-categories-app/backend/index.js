const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo_key';

// Weather categories mapping
const getWeatherCategory = (weatherMain, temp) => {
  const categories = [];
  
  // Temperature categories
  if (temp > 25) categories.push('Hot');
  else if (temp < 10) categories.push('Cold');
  else categories.push('Mild');
  
  // Weather condition categories
  switch (weatherMain.toLowerCase()) {
    case 'clear':
      categories.push('Sunny');
      break;
    case 'clouds':
      categories.push('Cloudy');
      break;
    case 'rain':
      categories.push('Rainy');
      break;
    case 'snow':
      categories.push('Snowy');
      break;
    case 'thunderstorm':
      categories.push('Stormy');
      break;
    default:
      categories.push('Other');
  }
  
  return categories;
};

// Get weather by city
app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    if (API_KEY === 'demo_key') {
      // Demo data when no API key is provided
      const demoWeather = {
        city: city,
        temperature: Math.floor(Math.random() * 30) + 5,
        description: 'Clear sky',
        main: 'Clear',
        humidity: Math.floor(Math.random() * 50) + 30,
        windSpeed: Math.floor(Math.random() * 10) + 2
      };
      
      const categories = getWeatherCategory(demoWeather.main, demoWeather.temperature);
      
      return res.json({
        ...demoWeather,
        categories
      });
    }
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    
    const weatherData = {
      city: response.data.name,
      temperature: Math.round(response.data.main.temp),
      description: response.data.weather[0].description,
      main: response.data.weather[0].main,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed
    };
    
    const categories = getWeatherCategory(weatherData.main, weatherData.temperature);
    
    res.json({
      ...weatherData,
      categories
    });
    
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(404).json({ error: 'City not found or API error' });
  }
});

// Get weather categories list
app.get('/api/categories', (req, res) => {
  res.json({
    temperature: ['Hot', 'Mild', 'Cold'],
    weather: ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Stormy', 'Other']
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (API_KEY === 'demo_key') {
    console.log('Using demo data - add OPENWEATHER_API_KEY to .env for real weather data');
  }
});