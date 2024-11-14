import React, { useState } from 'react';
import nakujaLogo from '../assets/nakujaLogo.png';

//left panel component
const StatusList = () => {
  const [rocketStatus, setRocketStatus] = useState("Preflight"); // Initial status

  const statuses = [
    { name: "Velocity = 0", status: "Awaiting" },
    { name: "Pitch/Yaw > 65", status: "Awaiting" },
    { name: "Acceleration", status: "Awaiting" },
    { name: "Altitude", status: "Achieved" },
  ];

  // Map statuses to background colors
  const statusColors = {
    Preflight: "bg-green-500",
    "Apogee Detected": "bg-yellow-500",
    "Main Chute Deployed": "bg-orange-500",
    "Landing Achieved": "bg-blue-500",
  };

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

      {/* Status Box */}
      <div className={`p-4 rounded-lg text-center text-white shadow-lg mt-4 ${statusColors[rocketStatus] || "bg-gray-500"}`}>
        <div className="text-xl font-bold">{rocketStatus}</div>
        <div className="text-sm text-gray-200">Rocket Status</div>
      </div>

    
     
    </div>
  );
};

export default StatusList;
