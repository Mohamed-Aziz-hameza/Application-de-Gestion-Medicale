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
import DoctorRegister from './components/DoctorRegister';
import PatientLogin from './components/PatientLogin';
import PatientRegister from './components/PatientRegister';
import AdminDashboard from './components/AdminDashboard';
import ProfilePage from './components/ProfilePage';
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
          <Route path="/doctor-register" element={<DoctorRegister />} />
          <Route path="/patient-login" element={<PatientLogin />} />
          <Route path="/patient-register" element={<PatientRegister />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;