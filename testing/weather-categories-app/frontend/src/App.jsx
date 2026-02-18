import React, { useState, useEffect } from 'react';

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    fetchCategories();
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchWeather = async (searchCity) => {
    if (!searchCity.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/weather/${encodeURIComponent(searchCity)}`);
      
      if (!response.ok) {
        throw new Error('City not found');
      }
      
      const data = await response.json();
      setWeather(data);
      
      // Update search history
      const newHistory = [searchCity, ...searchHistory.filter(item => item !== searchCity)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Hot': '#ff6b6b',
      'Mild': '#4ecdc4',
      'Cold': '#74b9ff',
      'Sunny': '#fdcb6e',
      'Cloudy': '#a29bfe',
      'Rainy': '#6c5ce7',
      'Snowy': '#fd79a8',
      'Stormy': '#e17055',
      'Other': '#636e72'
    };
    return colors[category] || '#636e72';
  };

  const getWeatherIcon = (main) => {
    const icons = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Drizzle': '🌦️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    };
    return icons[main] || '🌤️';
  };

  return (
    <div style={styles.container}>
      <div style={styles.app}>
        <header style={styles.header}>
          <h1 style={styles.title}>🌦️ Weather Categories</h1>
          <p style={styles.subtitle}>Get weather information with smart categorization</p>
        </header>

        <form onSubmit={handleSubmit} style={styles.searchForm}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name..."
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.searchButton}>
            {loading ? '🔄' : '🔍'} {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchHistory.length > 0 && (
          <div style={styles.history}>
            <h3 style={styles.historyTitle}>Recent Searches:</h3>
            <div style={styles.historyButtons}>
              {searchHistory.map((historyCity, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCity(historyCity);
                    fetchWeather(historyCity);
                  }}
                  style={styles.historyButton}
                >
                  {historyCity}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            ❌ {error}
          </div>
        )}

        {weather && (
          <div style={styles.weatherCard}>
            <div style={styles.weatherHeader}>
              <div style={styles.cityName}>
                {getWeatherIcon(weather.main)} {weather.city}
              </div>
              <div style={styles.temperature}>
                {weather.temperature}°C
              </div>
            </div>
            
            <div style={styles.description}>
              {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
            </div>
            
            <div style={styles.categories}>
              <h3 style={styles.categoriesTitle}>Categories:</h3>
              <div style={styles.categoryTags}>
                {weather.categories.map((category, index) => (
                  <span
                    key={index}
                    style={{
                      ...styles.categoryTag,
                      backgroundColor: getCategoryColor(category)
                    }}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={styles.details}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>💧 Humidity:</span>
                <span style={styles.detailValue}>{weather.humidity}%</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>💨 Wind Speed:</span>
                <span style={styles.detailValue}>{weather.windSpeed} m/s</span>
              </div>
            </div>
          </div>
        )}

        {categories && (
          <div style={styles.categoriesInfo}>
            <h3 style={styles.infoTitle}>Available Categories:</h3>
            <div style={styles.categorySection}>
              <h4 style={styles.sectionTitle}>Temperature:</h4>
              <div style={styles.categoryList}>
                {categories.temperature.map((cat, index) => (
                  <span key={index} style={{
                    ...styles.infoTag,
                    backgroundColor: getCategoryColor(cat)
                  }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div style={styles.categorySection}>
              <h4 style={styles.sectionTitle}>Weather Conditions:</h4>
              <div style={styles.categoryList}>
                {categories.weather.map((cat, index) => (
                  <span key={index} style={{
                    ...styles.infoTag,
                    backgroundColor: getCategoryColor(cat)
                  }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  app: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    margin: '0',
    fontSize: '2.5rem',
    color: '#2d3436',
    marginBottom: '10px'
  },
  subtitle: {
    margin: '0',
    color: '#636e72',
    fontSize: '1.1rem'
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  input: {
    flex: 1,
    padding: '15px',
    fontSize: '1rem',
    border: '2px solid #ddd',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  searchButton: {
    padding: '15px 25px',
    fontSize: '1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    whiteSpace: 'nowrap'
  },
  history: {
    marginBottom: '20px'
  },
  historyTitle: {
    margin: '0 0 10px 0',
    color: '#2d3436',
    fontSize: '1.1rem'
  },
  historyButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  historyButton: {
    padding: '8px 15px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s'
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#d63031',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '1.1rem'
  },
  weatherCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
  },
  weatherHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  cityName: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#2d3436'
  },
  temperature: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#667eea'
  },
  description: {
    fontSize: '1.2rem',
    color: '#636e72',
    marginBottom: '20px',
    textAlign: 'center'
  },
  categories: {
    marginBottom: '20px'
  },
  categoriesTitle: {
    margin: '0 0 10px 0',
    color: '#2d3436',
    fontSize: '1.2rem'
  },
  categoryTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  categoryTag: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  details: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#636e72'
  },
  detailValue: {
    color: '#2d3436'
  },
  categoriesInfo: {
    backgroundColor: '#f1f2f6',
    borderRadius: '15px',
    padding: '20px'
  },
  infoTitle: {
    margin: '0 0 15px 0',
    color: '#2d3436',
    textAlign: 'center'
  },
  categorySection: {
    marginBottom: '15px'
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    color: '#636e72',
    fontSize: '1rem'
  },
  categoryList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  infoTag: {
    padding: '4px 10px',
    borderRadius: '15px',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  }
};

export default App;