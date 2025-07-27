import React, { useState, useEffect, useRef } from "react";
import "../styles/PostRide.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

export default function PostRide() {
  const { isLoggedIn, activeAccount, addRideHistory } = useAuth();
  const navigate = useNavigate();

  const [rideData, setRideData] = useState({
    StartAddress: "",
    StartLat: "",
    StartLon: "",
    EndAddress: "",
    EndLat: null,
    EndLon: null,
    Fare: "",
    AvailableSeats: "",
    StartTime: "",
    PickupComment: "", // New field for driver comment
  });

  const [errors, setErrors] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Manual pickup location states
  const [useManualPickup, setUseManualPickup] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [isPickupSuggestionsVisible, setIsPickupSuggestionsVisible] = useState(false);
  const [loadingPickupSuggestions, setLoadingPickupSuggestions] = useState(false);

  const suggestionRef = useRef(null);
  const pickupSuggestionRef = useRef(null);
  const lastQuery = useRef("");
  const lastPickupQuery = useRef("");
  const LOCATIONIQ_API_KEY = "pk.04ae3b424787d702be2274b38a10e158";

  // Debounced function for dropoff suggestions
  const fetchDropoffSuggestionsDebounced = useRef(
    debounce(async (query) => {
      if (!query || query.length < 2 || query === lastQuery.current) return;

      lastQuery.current = query;

      try {
        setLoadingSuggestions(true);
        setApiError(null);

        const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
          query
        )}&countrycodes=LB&limit=5&format=json`;

        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`API request failed with status ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response format from API");

        const suggestions = data.map((item) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));

        setDropoffSuggestions(suggestions);
        setIsSuggestionsVisible(suggestions.length > 0);
      } catch (error) {
        setApiError("Could not load location suggestions. Please wait a few seconds.");
        setDropoffSuggestions([]);
        setIsSuggestionsVisible(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 1000)
  ).current;

  // Debounced function for pickup suggestions
  const fetchPickupSuggestionsDebounced = useRef(
    debounce(async (query) => {
      if (!query || query.length < 2 || query === lastPickupQuery.current) return;

      lastPickupQuery.current = query;

      try {
        setLoadingPickupSuggestions(true);

        const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
          query
        )}&countrycodes=LB&limit=5&format=json`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response format from API");

        const suggestions = data.map((item) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));

        setPickupSuggestions(suggestions);
        setIsPickupSuggestionsVisible(suggestions.length > 0);
      } catch (error) {
        setPickupSuggestions([]);
        setIsPickupSuggestionsVisible(false);
      } finally {
        setLoadingPickupSuggestions(false);
      }
    }, 1000)
  ).current;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setErrors((prev) => ({ ...prev, [name]: null }));

    if (name === "Fare" || name === "AvailableSeats") {
      setRideData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : value,
      }));
      return;
    }

    setRideData((prev) => ({ ...prev, [name]: value }));

    if (name === "EndAddress") {
      if (value.trim().length > 1) {
        fetchDropoffSuggestionsDebounced(value.trim());
      } else {
        setDropoffSuggestions([]);
        setIsSuggestionsVisible(false);
        setRideData((prev) => ({ ...prev, EndLat: null, EndLon: null }));
      }
    }

    if (name === "StartAddress" && useManualPickup) {
      if (value.trim().length > 1) {
        fetchPickupSuggestionsDebounced(value.trim());
      } else {
        setPickupSuggestions([]);
        setIsPickupSuggestionsVisible(false);
        setRideData((prev) => ({ ...prev, StartLat: "", StartLon: "" }));
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log('GPS Reading:', {
          lat: lat.toFixed(8),
          lon: lon.toFixed(8),
          accuracy: `${accuracy}m`
        });

        // Warn if accuracy is poor
        if (accuracy > 100) {
          const useAnyway = window.confirm(
            `GPS accuracy is poor (±${accuracy.toFixed(0)}m). ` +
            `This may result in inaccurate pickup location.\n\n` +
            `Click OK to use this location anyway, or Cancel to enter location manually.`
          );
          
          if (!useAnyway) {
            setUseManualPickup(true);
            setLoadingLocation(false);
            return;
          }
        }

        try {
          const response = await fetch(
            `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`
          );
          if (!response.ok) throw new Error("Failed to get address from coordinates");

          const data = await response.json();

          const addressParts = data.address || {};
          const formattedAddress = `${addressParts.road || ""} ${
            addressParts.neighbourhood || ""
          }, ${
            addressParts.city || addressParts.town || addressParts.village || ""
          }, ${addressParts.state || ""}, ${addressParts.country || ""}`
            .replace(/\s+/g, " ")
            .trim();

          const finalAddress = formattedAddress ||
            data.display_name ||
            `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

          setRideData((prev) => ({
            ...prev,
            StartAddress: finalAddress,
            StartLat: lat,
            StartLon: lon,
            PickupComment: "", // Clear comment when using GPS
          }));

          setErrors((prev) => ({
            ...prev,
            StartAddress: null,
            StartLat: null,
            StartLon: null,
          }));

          setUseManualPickup(false); // GPS worked, disable manual mode

        } catch (error) {
          alert("Could not fetch address: " + error.message);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location: ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += error.message;
            break;
        }
        
        const useManual = window.confirm(
          errorMessage + "\n\nWould you like to enter your pickup location manually instead?"
        );
        
        if (useManual) {
          setUseManualPickup(true);
        }
        
        setLoadingLocation(false);
      },
      options
    );
  };

  const handleSuggestionClick = (suggestion) => {
    setRideData((prev) => ({
      ...prev,
      EndAddress: suggestion.display_name,
      EndLat: parseFloat(suggestion.lat),
      EndLon: parseFloat(suggestion.lon),
    }));
    setIsSuggestionsVisible(false);

    setErrors((prev) => ({
      ...prev,
      EndAddress: null,
      EndLat: null,
      EndLon: null,
    }));
  };

  const handlePickupSuggestionClick = (suggestion) => {
    setRideData((prev) => ({
      ...prev,
      StartAddress: suggestion.display_name,
      StartLat: parseFloat(suggestion.lat),
      StartLon: parseFloat(suggestion.lon),
    }));
    setIsPickupSuggestionsVisible(false);

    setErrors((prev) => ({
      ...prev,
      StartAddress: null,
      StartLat: null,
      StartLon: null,
    }));
  };

  const toggleManualPickup = () => {
    setUseManualPickup(!useManualPickup);
    if (!useManualPickup) {
      // Switching to manual, clear GPS data
      setRideData((prev) => ({
        ...prev,
        StartAddress: "",
        StartLat: "",
        StartLon: "",
        PickupComment: "", // Clear comment when switching modes
      }));
    } else {
      // Switching to GPS, clear comment
      setRideData((prev) => ({
        ...prev,
        PickupComment: "",
      }));
    }
    setPickupSuggestions([]);
    setIsPickupSuggestionsVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setTimeout(() => setIsSuggestionsVisible(false), 100);
      }
      
      if (
        pickupSuggestionRef.current &&
        !pickupSuggestionRef.current.contains(event.target)
      ) {
        setTimeout(() => setIsPickupSuggestionsVisible(false), 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn || !activeAccount) {
      navigate("/signup");
      return;
    }

    const newErrors = {};
    if (!rideData.StartAddress) newErrors.StartAddress = "Pickup location is required.";
    if (!rideData.StartLat || isNaN(parseFloat(rideData.StartLat))) newErrors.StartLat = "Pickup latitude is invalid.";
    if (!rideData.StartLon || isNaN(parseFloat(rideData.StartLon))) newErrors.StartLon = "Pickup longitude is invalid.";
    if (!rideData.EndAddress.trim()) newErrors.EndAddress = "Dropoff location is required.";
    if (rideData.EndLat === null || isNaN(parseFloat(rideData.EndLat))) newErrors.EndLat = "Dropoff latitude is invalid.";
    if (rideData.EndLon === null || isNaN(parseFloat(rideData.EndLon))) newErrors.EndLon = "Dropoff longitude is invalid.";

    const fareValue = parseFloat(rideData.Fare);
    if (isNaN(fareValue) || fareValue <= 0) newErrors.Fare = "Fare must be a number greater than 0.";

    const seatsNumber = parseInt(rideData.AvailableSeats, 10);
    if (isNaN(seatsNumber) || seatsNumber <= 0) newErrors.AvailableSeats = "Seats available must be a number greater than 0.";

    if (!rideData.StartTime) newErrors.StartTime = "Start time is required.";

    // Validate pickup comment when using manual pickup
    if (useManualPickup && !rideData.PickupComment.trim()) {
      newErrors.PickupComment = "Please provide pickup instructions when entering location manually.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newRide = {
      UserId: 1,
      StartAddress: rideData.StartAddress.trim(),
      StartLat: parseFloat(rideData.StartLat),
      StartLon: parseFloat(rideData.StartLon),
      EndAddress: rideData.EndAddress.trim(),
      EndLat: parseFloat(rideData.EndLat),
      EndLon: parseFloat(rideData.EndLon),
      Fare: fareValue,
      AvailableSeats: seatsNumber,
      StartTime: new Date(rideData.StartTime).toISOString(),
      PickupComment: useManualPickup ? rideData.PickupComment.trim() : null // Only include comment if manual pickup
    };

    try {
      const res = await fetch("https://localhost:7221/api/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRide),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData?.message
          ? `${errorData.message}${errorData.errors ? ": " + errorData.errors.join(", ") : ""}`
          : `Error ${res.status}`;
        throw new Error(errorMessage);
      }

      const savedRide = await res.json();
      addRideHistory(savedRide);
      alert("Ride posted successfully!");

      setRideData({
        StartAddress: "",
        StartLat: "",
        StartLon: "",
        EndAddress: "",
        EndLat: null,
        EndLon: null,
        Fare: "",
        AvailableSeats: "",
        StartTime: "",
        PickupComment: "",
      });
      setErrors({});
      setUseManualPickup(false);
    } catch (error) {
      alert("Failed to post ride: " + error.message);
    }
  };

  return (
    <div className="post-ride-container">
      <h2 className="post-ride-title">Post a Ride</h2>
      <form onSubmit={handleSubmit} className="post-ride-form" autoComplete="off" noValidate>
        
        <label>Pickup Location</label>
        
        <div style={{ marginBottom: '10px' }}>
          <button
            type="button"
            onClick={toggleManualPickup}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              backgroundColor: useManualPickup ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            {useManualPickup ? 'Switch to GPS' : 'Enter Manually'}
          </button>
        </div>

        {!useManualPickup ? (
          // GPS Mode
          <>
            <input
              type="text"
              name="StartAddress"
              placeholder="Current location will appear here"
              value={rideData.StartAddress}
              readOnly
              required
              className={errors.StartAddress ? "input-error" : ""}
            />
            {errors.StartAddress && (
              <div className="error-message">{errors.StartAddress}</div>
            )}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loadingLocation}
              className="get-location-btn"
            >
              {loadingLocation ? "Detecting..." : "Get Current Location"}
            </button>
          </>
        ) : (
          // Manual Mode
          <>
            <div className="suggestions-container" ref={pickupSuggestionRef}>
              <input
                type="text"
                name="StartAddress"
                placeholder="Enter pickup location (e.g., Hamra, Beirut)"
                value={rideData.StartAddress}
                onChange={handleChange}
                required
                autoComplete="off"
                className={errors.StartAddress ? "input-error" : ""}
              />
              {loadingPickupSuggestions && (
                <div className="suggestions-loading">Searching for locations...</div>
              )}
              {isPickupSuggestionsVisible && pickupSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {pickupSuggestions.map((item) => (
                    <li
                      key={item.place_id}
                      onClick={() => handlePickupSuggestionClick(item)}
                      className="suggestion-item"
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
              {errors.StartAddress && (
                <div className="error-message">{errors.StartAddress}</div>
              )}
            </div>

            {/* Pickup Comment Field - Only shown in manual mode */}
            <label style={{ marginTop: '15px' }}>Pickup Instructions</label>
            <textarea
              name="PickupComment"
              placeholder="Provide specific pickup instructions (e.g., 'Wait near the pharmacy entrance', 'Call when you arrive', 'Building with blue door')"
              value={rideData.PickupComment}
              onChange={handleChange}
              rows="3"
              required
              className={errors.PickupComment ? "input-error" : ""}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '70px'
              }}
            />
            {errors.PickupComment && (
              <div className="error-message">{errors.PickupComment}</div>
            )}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Help passengers find you by providing clear pickup instructions
            </div>
          </>
        )}

        <label>Dropoff Location</label>
        <div className="suggestions-container" ref={suggestionRef}>
          <input
            type="text"
            name="EndAddress"
            placeholder="Enter dropoff location (e.g., Hamra, Beirut)"
            value={rideData.EndAddress}
            onChange={handleChange}
            required
            autoComplete="off"
            className={errors.EndAddress ? "input-error" : ""}
          />
          {loadingSuggestions && (
            <div className="suggestions-loading">Searching for locations...</div>
          )}
          {apiError && (
            <div className="suggestions-loading" style={{ color: "red" }}>
              {apiError}
            </div>
          )}
          {isSuggestionsVisible && dropoffSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {dropoffSuggestions.map((item) => (
                <li
                  key={item.place_id}
                  onClick={() => handleSuggestionClick(item)}
                  className="suggestion-item"
                >
                  {item.display_name}
                </li>
              ))}
            </ul>
          )}
          {errors.EndAddress && (
            <div className="error-message">{errors.EndAddress}</div>
          )}
        </div>

        <label>Fare (USD)</label>
        <input
          type="number"
          name="Fare"
          placeholder="e.g., 15.50"
          value={rideData.Fare}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          required
          className={errors.Fare ? "input-error" : ""}
        />
        {errors.Fare && <div className="error-message">{errors.Fare}</div>}

        <label>Seats Available</label>
        <input
          type="number"
          name="AvailableSeats"
          placeholder="Number of seats available"
          value={rideData.AvailableSeats}
          onChange={handleChange}
          min="1"
          required
          className={errors.AvailableSeats ? "input-error" : ""}
        />
        {errors.AvailableSeats && (
          <div className="error-message">{errors.AvailableSeats}</div>
        )}

        <label>Start Time</label>
        <input
          type="datetime-local"
          name="StartTime"
          value={rideData.StartTime}
          onChange={handleChange}
          required
          className={errors.StartTime ? "input-error" : ""}
        />
        {errors.StartTime && (
          <div className="error-message">{errors.StartTime}</div>
        )}

        <button type="submit" className="post-ride-btn">
          Post Ride
        </button>
      </form>
    </div>
  );
}