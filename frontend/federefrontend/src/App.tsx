import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// App.jsx


import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Profiles from './components/Profiles';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin';
import DoctorLogin from './components/DoctorLogin';
import PatientLogin from './components/PatientLogin';
import AdminDashboard from './components/AdminDashboard';
import MedecinDashboard from './components/MedecinDashboard';
import PatientDashboard from './components/PatientDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <Profiles />
      <CallToAction />
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/patient-login" element={<PatientLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/medecin-dashboard" element={<MedecinDashboard />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;