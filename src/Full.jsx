import React from 'react';
import Navbar from './componenets/Navbar';
import Footer from './componenets/Footer';
import { Outlet } from 'react-router-dom';

const Full = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Full;
