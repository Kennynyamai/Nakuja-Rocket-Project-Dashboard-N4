import React from 'react';
import StatusList from './components/StatusList';
import MainDashboard from './components/MainDashboard';
import nakujaLogo from './assets/nakujaLogo.png';



function App() {
  return (

    //navbar div with image and dashboard title
    <div className="min-h-screen bg-gray-900 text-white p-3">
<div className="flex items-center justify-between mb-4">


  <img
    src={nakujaLogo}
    alt="NAKUJA PROJECT Logo"
    className="w-16 h-16 ml-4 rounded-lg" 
  />

  <h1 className="text-center text-3xl font-bold flex-grow">Nakuja N4 Rocket Dashboard</h1>
</div>


  {/* setting up the components */}
      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6"> 
        <div className="md:w-1/4">
          <StatusList />
        </div>
        <div className="md:w-3/4">
          <MainDashboard />
        </div>
      </div>
  
    </div>
  );
}

export default App;
