import React, { createContext, useState } from 'react';

// Create Context
export const SensorContext = createContext();

// Context Provider
export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({
    altitude: 0,
    vertical_velocity: 0,
    acceleration: 0,
    roll: 0,
    yaw: 0,
    flightstate: 0,
    time:0,
  });


  return (
    <SensorContext.Provider value={{ sensorData, setSensorData }}>
      {children}
    </SensorContext.Provider>
  );
};
