import React, { useContext, useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { RidesContext } from "../context/RidesContext";

const mapContainerStyle = { width: "100%", height: "400px" };

const RidesMap = () => {
  const { rides } = useContext(RidesContext);
  const [center, setCenter] = useState({ lat: 33.8938, lng: 35.5018 }); // Beirut default

  // Optionally get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {}
    );
  }, []);

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12}>
        {rides.map((ride, idx) => (
          <Marker
            key={idx}
            position={{ lat: parseFloat(ride.lat), lng: parseFloat(ride.lng) }}
            title={`Driver: ${ride.driver}\nFrom: ${ride.from}\nTo: ${ride.to}`}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default RidesMap;
