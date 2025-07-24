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
    SeatsAvailable: "",
    StartTime: "",
  });

  const [errors, setErrors] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [apiError, setApiError] = useState(null);

  const suggestionRef = useRef(null);
  const lastQuery = useRef("");
  const LOCATIONIQ_API_KEY = "pk.04ae3b424787d702be2274b38a10e158";

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error for this field on change
    setErrors((prev) => ({ ...prev, [name]: null }));

    if (name === "Fare") {
      setRideData((prev) => ({
        ...prev,
        Fare: value === "" ? "" : value,
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
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

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

          setRideData((prev) => ({
            ...prev,
            StartAddress:
              formattedAddress ||
              data.display_name ||
              `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
            StartLat: lat,
            StartLon: lon,
          }));

          // Clear errors on location set
          setErrors((prev) => ({
            ...prev,
            StartAddress: null,
            StartLat: null,
            StartLon: null,
          }));
        } catch (error) {
          alert("Could not fetch address: " + error.message);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        alert("Unable to retrieve your location: " + error.message);
        setLoadingLocation(false);
      }
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

    // Clear errors on suggestion select
    setErrors((prev) => ({
      ...prev,
      EndAddress: null,
      EndLat: null,
      EndLon: null,
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setTimeout(() => setIsSuggestionsVisible(false), 100);
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

    // Validate fields and collect errors
    const newErrors = {};
    if (!rideData.StartAddress) newErrors.StartAddress = "Pickup location is required.";
    if (!rideData.StartLat || isNaN(parseFloat(rideData.StartLat))) newErrors.StartLat = "Pickup latitude is invalid.";
    if (!rideData.StartLon || isNaN(parseFloat(rideData.StartLon))) newErrors.StartLon = "Pickup longitude is invalid.";
    if (!rideData.EndAddress.trim()) newErrors.EndAddress = "Dropoff location is required.";
    if (rideData.EndLat === null || isNaN(parseFloat(rideData.EndLat))) newErrors.EndLat = "Dropoff latitude is invalid.";
    if (rideData.EndLon === null || isNaN(parseFloat(rideData.EndLon))) newErrors.EndLon = "Dropoff longitude is invalid.";

    const fareValue = parseFloat(rideData.Fare);
    if (isNaN(fareValue) || fareValue <= 0) newErrors.Fare = "Fare must be a number greater than 0.";

    const seatsNumber = parseInt(rideData.SeatsAvailable, 10);
    if (isNaN(seatsNumber) || seatsNumber <= 0) newErrors.SeatsAvailable = "Seats available must be a number greater than 0.";

    if (!rideData.StartTime) newErrors.StartTime = "Start time is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newRide = {
      UserId: activeAccount.id || 1, // use activeAccount id if available
      StartAddress: rideData.StartAddress.trim(),
      StartLat: parseFloat(rideData.StartLat),
      StartLon: parseFloat(rideData.StartLon),
      EndAddress: rideData.EndAddress.trim(),
      EndLat: parseFloat(rideData.EndLat),
      EndLon: parseFloat(rideData.EndLon),
      Fare: fareValue,
      SeatsAvailable: seatsNumber,
      StartTime: rideData.StartTime,
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
        SeatsAvailable: "",
        StartTime: "",
      });
      setErrors({});
    } catch (error) {
      alert("Failed to post ride: " + error.message);
    }
  };

  return (
    <div className="post-ride-container">
      <h2 className="post-ride-title">Post a Ride</h2>
      <form onSubmit={handleSubmit} className="post-ride-form" autoComplete="off" noValidate>
        <label>Pickup Location (Click button to detect)</label>
        <input
          type="text"
          name="StartAddress"
          placeholder="Current location will appear here"
          value={rideData.StartAddress}
          readOnly
          required
          aria-describedby="startAddressError"
          className={errors.StartAddress ? "input-error" : ""}
        />
        {errors.StartAddress && (
          <div id="startAddressError" className="error-message">
            {errors.StartAddress}
          </div>
        )}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loadingLocation}
          className="get-location-btn"
        >
          {loadingLocation ? "Detecting..." : "Get Current Location"}
        </button>

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
            aria-describedby="endAddressError"
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
            <div id="endAddressError" className="error-message">
              {errors.EndAddress}
            </div>
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
          inputMode="decimal"
          aria-describedby="fareError"
          className={errors.Fare ? "input-error" : ""}
        />
        {errors.Fare && (
          <div id="fareError" className="error-message">
            {errors.Fare}
          </div>
        )}

        <label>Seats Available</label>
        <input
          type="number"
          name="SeatsAvailable"
          placeholder="Number of seats available"
          value={rideData.SeatsAvailable}
          onChange={handleChange}
          min="1"
          required
          aria-describedby="seatsAvailableError"
          className={errors.SeatsAvailable ? "input-error" : ""}
        />
        {errors.SeatsAvailable && (
          <div id="seatsAvailableError" className="error-message">
            {errors.SeatsAvailable}
          </div>
        )}

        <label>Start Time</label>
        <input
          type="datetime-local"
          name="StartTime"
          value={rideData.StartTime}
          onChange={handleChange}
          required
          aria-describedby="startTimeError"
          className={errors.StartTime ? "input-error" : ""}
        />
        {errors.StartTime && (
          <div id="startTimeError" className="error-message">
            {errors.StartTime}
          </div>
        )}

        <button type="submit" className="post-ride-btn">
          Post Ride
        </button>
      </form>
    </div>
  );
}
