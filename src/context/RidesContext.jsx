// src/context/RidesContext.jsx
import React, { createContext, useState } from "react";

export const RidesContext = createContext();

export const RidesProvider = ({ children }) => {
  const [rides, setRides] = useState([]);

  const addRide = (ride) => {
    setRides((prev) => [...prev, ride]);
  };

  return (
    <RidesContext.Provider value={{ rides, addRide }}>
      {children}
    </RidesContext.Provider>
  );
};
