import Navbar from '@/components/Navbar';
import React from 'react';

const Dashboard = () => {

  return (
     <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <Navbar />

    {/* Main Content */}
    <main className="flex-1 mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
      </div>
    </main>
  </div>
  );
};

export default Dashboard;
