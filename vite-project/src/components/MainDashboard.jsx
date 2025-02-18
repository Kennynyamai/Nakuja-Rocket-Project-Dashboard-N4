import React, { useEffect, useState, useContext } from 'react';
import { SensorContext } from '../context/SensorContext';
import mqtt from 'mqtt';

const MainDashboard = () => {
  const { sensorData, setSensorData } = useContext(SensorContext);
  useEffect(() => {
    // Connect to the MQTT broker
    const client = mqtt.connect('ws://localhost:8080/mqtt'); // Use WebSocket-compatible broker

    // Setup error handling after the connection
    client.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe('esp32/sensor_data', (err, granted) => {
        if (err) {
          console.error('Subscription failed:', err);
        } else {
          console.log('Successfully subscribed to topics:', granted);
        }
      });
    });
    

    // Message handler that updates sensor data
    client.on('message', (topic, message) => {
      const msg = JSON.parse(message.toString()); // Parse the message
      console.log(`Received message on ${topic}:`, msg);

      setSensorData((prevData) => ({
        ...prevData,
        altitude: msg.altitude || prevData.altitude,
        vertical_velocity: msg.vertical_velocity || prevData.vertical_velocity,
        acceleration: msg.acceleration || prevData.acceleration,
        flightstate: msg.flightstate || prevData.flightstate,
        roll: msg.roll || prevData.roll,
        yaw: msg.yaw || prevData.yaw,
      }));
    });

    // Cleanup MQTT connection when the component unmounts
    return () => {
      client.end();
    };
  }, []); // Empty dependency array ensures this effect runs only once

   // Destructure data for ease of use
   const { altitude, vertical_velocity, acceleration } = sensorData;


  console.log('sensor data', sensorData);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {/* Metric Cards */}
      <div className="bg-gray-800 text-white p-6 rounded-lg text-center shadow-lg transition-transform transform hover:scale-105">
        <div className="text-lg text-gray-400">Altitude</div>
        <div className="text-2xl font-bold">{altitude} m</div>
        <div className="bg-gray-600 rounded-full p-4 mx-auto inline-block transition-transform transform hover:scale-110 mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-indigo-400">
            <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
            <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
            <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
            <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
          </svg>
        </div>
      </div>

      <div className="bg-gray-800 text-white p-6 rounded-lg text-center shadow-lg transition-transform transform hover:scale-105">
        <div className="text-lg text-gray-400">Velocity</div>
        <div className="text-2xl font-bold">{vertical_velocity} m/s</div>
        <div className="bg-gray-600 rounded-full p-4 mx-auto inline-block transition-transform transform hover:scale-110 mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-green-400">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </div>
      </div>

      <div className="bg-gray-800 text-white p-6 rounded-lg text-center shadow-lg transition-transform transform hover:scale-105">
        <div className="text-lg text-gray-400">Acceleration</div>
        <div className="text-2xl font-bold">{acceleration} m/s²</div>
        <div className="bg-gray-600 rounded-full p-4 mx-auto inline-block transition-transform transform hover:scale-110 mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" className="w-10 h-10 text-orange-400" height="1em" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.498 18.414V11.19c0-1.329 0-1.993.599-2.158c.598-.166 1.303.304 2.712 1.244l12.774 8.516c1.41.939 2.114 1.409 1.866 1.808s-1.244.4-3.237.4H6.377c-1.828 0-2.743 0-3.31-.379c-.569-.378-.569-.988-.569-2.207m6-7.414a4 4 0 1 0 0-8a4 4 0 0 0 0 8m7.004-1.004l5.903 3.384m0 0c.32-.34-.22-1.32-.677-2.652m.677 2.652c-.22.24-.941.3-2.641.618" />
          </svg>
        </div>
      </div>

      <div className="bg-gray-800 text-white p-6 rounded-lg text-center shadow-lg transition-transform transform hover:scale-105">
        <div className="text-lg text-gray-400">Latitude</div>
        <div className="text-2xl font-bold">1.07° s</div>
        <div className="bg-gray-600 rounded-full p-4 mx-auto inline-block transition-transform transform hover:scale-110 mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-blue-400">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM8.547 4.505a8.25 8.25 0 1 0 11.672 8.214l-.46-.46a2.252 2.252 0 0 1-.422-.586l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.211.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.654-.261a2.25 2.25 0 0 1-1.384-2.136c.139-.912 1.316-1.255 1.99-.318l.827-.654a1.414 1.414 0 0 0 .052-.602l-3.498 1.548c.012-.217.085-.423.187-.617c1.01-.957-.106-2.77-1.602-3.119z" />
          </svg>
        </div>
      </div>

      <div className="bg-gray-800 text-white p-6 rounded-lg text-center shadow-lg transition-transform transform hover:scale-105">
        <div className="text-lg text-gray-400">Longitude</div>
        <div className="text-2xl font-bold">37.02° E</div>
        <div className="bg-gray-600 rounded-full p-4 mx-auto inline-block transition-transform transform hover:scale-110 mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-yellow-400">
  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM8.547 4.505a8.25 8.25 0 1 0 11.672 8.214l-.46-.46a2.252 2.252 0 0 1-.422-.586l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.211.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.654-.261a2.25 2.25 0 0 1-1.384-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.279-2.132Z" clipRule="evenodd" />
</svg>

        </div>
      </div>

      <div className="bg-gray-800 text-white p-6 rounded-lg text-center shadow-lg transition-transform transform hover:scale-105">
        <div className="text-lg text-gray-400">Time</div>
        <div className="text-2xl font-bold">0.00 S</div>
        <div className="bg-gray-600 rounded-full p-4 mx-auto inline-block transition-transform transform hover:scale-110 mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-purple-400">
  <path fillRule="evenodd" d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 15.53a.75.75 0 0 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
</svg>

        </div>
      </div>

   {/* small rocket logo at the bottom of the page    */}
<div className="col-span-full flex flex-col items-center ">

<div className="bg-teal-600 rounded-full p-3 shadow-lg transition-transform transform hover:scale-105">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-teal-400">
      <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
      <path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
    </svg>
  </div>
 

 
</div>


    </div>
  );
};

export default MainDashboard;
