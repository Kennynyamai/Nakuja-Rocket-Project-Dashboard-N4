import React, { useState, useEffect, useContext } from 'react';
import { SensorContext } from '../context/SensorContext';
import mqtt from 'mqtt';
import nakujaLogo from '../assets/nakujaLogo.png';

const StatusList = () => {
   const { sensorData, setSensorData } = useContext(SensorContext);
   const [isDemoRunning, setIsDemoRunning] = useState(false);

    // Function to start the demo
    const startDemo = () => {
      setIsDemoRunning(true);
      let flightState = 0;
      let altitude = 0;
      let verticalVelocity = 0;
      let acceleration = 0;
      let roll = 0;
      let yaw = 0;
      let time = 0;
    
      const maxAltitude = 500;
    
      const interval = setInterval(() => {
        time++; // Increment time every second
    
        // Update sensor data based on the current flight state
        switch (flightState) {
          case 0: // Preflight (5 seconds)
            acceleration += 5;  // Gradual increase in acceleration
            if (time === 5) {
              flightState = 1; // Transition to Powered Flight
            }
            break;
    
          case 1: // Powered Flight (15 seconds)
            acceleration = 30; // Constant acceleration
            verticalVelocity += 40; // Increase vertical velocity more gradually
            altitude += verticalVelocity * 0.1; // Simulate altitude increase more gradually
    
            roll += Math.floor(Math.random() * 3);
            yaw += Math.floor(Math.random() * 3);
    
            if (time === 20) {
              flightState = 2; // Transition to Apogee
            }
            break;
    
          case 2: // Apogee (5 seconds)
            acceleration = 0;
            verticalVelocity = 0; // No velocity at apogee
            altitude = maxAltitude; // Maximum altitude is reached
    
            if (time === 25) {
              flightState = 3; // Transition to Drogue Descent
            }
            break;
    
          case 3: // Drogue Descent (8 seconds)
            acceleration = -9.8; // Gravity acting downward
            verticalVelocity -= 80; // Decelerating the rocket faster
            altitude += verticalVelocity * 0.1; // Simulate descent
    
            if (time === 33) {
              flightState = 4; // Transition to Main Parachute Descent
            }
            break;
    
          case 4: // Main Parachute Descent (10 seconds)
            acceleration = -9.8; // Gravity acting downward
            verticalVelocity = -20; // Slower descent due to parachute
            altitude += verticalVelocity * 0.1; // Simulate controlled descent
    
            if (time === 43) {
              flightState = 5; // Transition to Post Flight
            }
            break;
    
          case 5: // Post Flight (7 seconds)
            acceleration = 0;
            verticalVelocity = 0;
            altitude = 0;
            roll = 0;
            yaw = 0;
    
            if (time === 50) {
              clearInterval(interval);
              setIsDemoRunning(false);
            }
            break;
    
          default:
            break;
        }
    
        // Update sensor data context
        setSensorData((prev) => ({
          ...prev,
          altitude: Math.max(0, Math.floor(altitude)), // Altitude can't be negative
          flightstate: flightState,
          vertical_velocity: verticalVelocity,
          acceleration,
          roll,
          yaw,
          time,
        }));
      }, 1000); // Update every second
    };
    
    
   const [statuses, setStatuses] = useState([
    { name: "Acceleration", status: "Awaiting" },
    { name: "Yaw > 60", status: "Awaiting" },
    { name: "roll > 60", status: "Awaiting" },
  ]);

  // Update statuses when flightstate changes
  useEffect(() => {
    if (sensorData.flightstate === 2) {
      setStatuses((prevStatuses) =>
        prevStatuses.map((item) => ({
          ...item,
          status: "Achieved", // Update status to "Achieved" if flightstate is 3
        }))
      );
    } else {
      setStatuses((prevStatuses) =>
        prevStatuses.map((item) => ({
          ...item,
          status: "Awaiting", // Revert status to "Awaiting" for other states
        }))
      );
    }
  }, [sensorData.flightstate]);



  // Map statuses to background colors
  const statusColors = {
    "Preflight": "bg-green-500",
    "Powered Flight": "bg-yellow-500",
    "Apogee": "bg-orange-500",
    "Drogue descent": "bg-blue-500",
    "Main descent": "bg-purple-500",
    "Postflight": "bg-red-500",
  };

  // Map rocket status number to phase name
  const statusMapping = {
    0: "Preflight",
    1: "Powered Flight",
    2: "Apogee",
    3: "Drogue descent",
    4: "Main descent",
    5: "Postflight",
  };

  // Get the corresponding phase based on the rocketStatus number
  const currentStatus = statusMapping[sensorData.flightstate] || "Unknown Status";

  // Determine the background color based on the current phase
  const currentStatusColor = statusColors[currentStatus] || "bg-gray-500";

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
      <h2 className="text-white text-xl font-semibold mb-4">Apogee Thresholds</h2>
      {statuses.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${item.status === "Achieved" ? "bg-green-500" : "bg-gray-400"}`} />
          <span className="text-white">{item.name}</span>
          <span className={`ml-auto px-2 py-1 rounded text-sm font-semibold ${item.status === "Achieved" ? "bg-green-500 text-white" : "bg-gray-500 text-gray-300"}`}>
            {item.status}
          </span>
        </div>
      ))}

      {/* Rocket Status Box */}
      <div className={`p-4 rounded-lg text-center text-white shadow-lg mt-4 ${currentStatusColor}`}>
        <div className="text-xl font-bold">{currentStatus}</div>
        <div className="text-sm text-gray-200">Rocket Status</div>
      </div>

      <button 
  className="w-full p-4 rounded-lg text-center text-white shadow-lg mt-4 bg-teal-500 transition-transform transform hover:scale-105 focus:outline-none"
  onClick={startDemo}
  disabled={isDemoRunning}
>
  <div className="text-xl font-bold">{isDemoRunning ? "Demo Running..." : "Start Demo"}</div>
</button>

    </div>
  );
}

export default StatusList;
