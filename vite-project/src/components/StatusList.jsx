import React, { useState, useEffect, useContext } from 'react';
import { SensorContext } from '../context/SensorContext';
import mqtt from 'mqtt';
import nakujaLogo from '../assets/nakujaLogo.png';

const StatusList = () => {
   const { sensorData, setSensorData } = useContext(SensorContext);

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
    </div>
  );
}

export default StatusList;
