import React, { useState, useEffect } from 'react';
import './LocationSearch.css';

const LocationSearch = ({
  label,
  value,
  suggestions,
  onSearch,
  onSelect,
  onClear
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onSearch(value);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion) => {
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setInputValue('');
    onClear();
  };

  return (
    <div className="location-search">
      <label>{label}</label>
      <div className="search-input">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="Enter destination..."
        />
        {value && (
          <button className="clear-btn" onClick={handleClear}>
            ×
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((item, index) => (
            <li key={index} onClick={() => handleSelect(item)}>
              {item.display}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;