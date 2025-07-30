import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Full from "./Full.jsx"; // Has Navbar, Outlet, Footer
import Home from "./pages/Home";
import Rides from "./pages/Rides";
import PostRide from "./pages/PostRide";
import SignUp from "./pages/SignUp";
import RidesMap from "./pages/RidesMap.jsx";
import DriverSignUp from "./pages/DriverSignUp.jsx";       
import AdminDashboard from "./pages/AdminPage.jsx";    
import AccountInfo from "./pages/AccountInfo.jsx";          
import { AuthProvider } from "./context/AuthContext";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import AccountSelection from "./pages/AccountSelection";
import ChatPage from "./pages/ChatPage.jsx"; // <-- Import ChatPage

const App = () => {
  // This holds all driver sign-up requests for admin approval
  const [driverRequests, setDriverRequests] = useState([]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Full />}>
          <Route index element={<Home />} />
          <Route path="rides" element={<Rides />} />
          <Route path="postride" element={<PostRide />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="available-rides" element={<RidesMap />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/accounts" element={<AccountSelection />} />
          <Route path="/account-info/:id" element={<AccountInfo />} />
          

          {/* New route for drivers to submit license/id scans */}
          <Route
            path="driver-signup"
            element={
              <DriverSignUp
                onSubmit={(request) => {
                  setDriverRequests((prev) => [...prev, request]);
                }}
              />
            }
          />

          {/* New route for admin to verify drivers */}
      <Route path="admin" element={<AdminDashboard />} />

          {/* NEW: Route for Account Info page */}
          <Route path="account" element={<AccountInfo />} />

          {/* NEW: Route for Chat Page */}
          <Route path="chat/:rideId" element={<ChatPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
