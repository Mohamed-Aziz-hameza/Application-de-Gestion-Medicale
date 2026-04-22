import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// App.jsx


import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import DoctorLogin from './components/DoctorLogin';
import DoctorRegister from './components/DoctorRegister';
import MedecinDashboard from './components/MedecinDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
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
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/doctor-register" element={<DoctorRegister />} />
          <Route path="/medecin-dashboard" element={<MedecinDashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;