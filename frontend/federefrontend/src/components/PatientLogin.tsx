
import React, { useState, useEffect } from "react";
import "./PatientLogin.css";
import logo from "../assets/logo.png";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginPatient, verifyPatientOtp, setToken, setUser, isAuthenticated, getUser } from "../services/api";

const PatientLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      if (user && user.role === 'ROLE_ADMIN') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user) {
        navigate('/patient-dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginPatient({ email, motDePasse: password });
      setOtpMessage(res.message || "Un code OTP a été envoyé à votre email.");
      setOtpStep(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otpCode) {
      setError("Veuillez entrer le code OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyPatientOtp({ email, codeOtp: otpCode });
      setToken(res.token);
      setUser(res);
      navigate("/patient-dashboard");
    } catch (err: any) {
      setError(err.message || "Code OTP invalide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: 'linear-gradient(90deg, #e7f2ff 0%, #f6fbff 50%, #fff 100%)'}}>
      {/* Colonne gauche */}
      <div style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 0 0 70px',
        position: 'relative',
        overflow: 'hidden',
      }}>
      
        <div style={{position: 'relative', zIndex: 1, width: '100%'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40}}>
            <img src={logo} alt="MediCare+" style={{width: 54, height: 54, borderRadius: 14, background: '#fff', objectFit: 'cover'}} />
            <div>
              <h3 style={{margin: 0}}>MediCare+</h3>
              <span style={{fontSize: 13}}>Gestion Médicale</span>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.13)', borderRadius: 12, padding: '8px 18px', marginBottom: 24, fontWeight: 600}}>
            <FaUser style={{fontSize: 20}} /> Espace Patient <span style={{fontWeight: 400, fontSize: 13, opacity: 0.8}}>&nbsp;Bienvenue</span>
          </div>
          <h1 style={{fontSize: 32, fontWeight: 900, margin: 0, marginBottom: 18}}>Suivez votre santé en toute facilité</h1>
          <ul style={{listStyle: 'none', padding: 0, margin: 0, color: '#fff', fontSize: 17, fontWeight: 500, marginBottom: 30}}>
            <li style={{marginBottom: 10}}><span style={{color: '#fff', marginRight: 8}}>✔</span> Accès à votre dossier médical complet</li>
            <li style={{marginBottom: 10}}><span style={{color: '#fff', marginRight: 8}}>✔</span> Gestion simple de vos rendez-vous</li>
            <li style={{marginBottom: 10}}><span style={{color: '#fff', marginRight: 8}}>✔</span> Consultation de vos résultats d'analyses</li>
            <li><span style={{color: '#fff', marginRight: 8}}>✔</span> Notifications et rappels automatiques</li>
          </ul>
          <div style={{marginTop: 40, color: '#f3e8ff', fontSize: 14}}>
            © 2026 MediCare+ • Votre santé, notre priorité
          </div>
        </div>
      </div>
      {/* Colonne droite */}
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #f6fbff 0%, #fff 100%)'}}>
        <form onSubmit={otpStep ? handleOtpSubmit : handleSubmit} style={{background: '#fff', borderRadius: 22, boxShadow: '0 8px 40px rgba(15,23,42,0.13)', padding: '44px 38px 32px 38px', maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24}}>
            <div style={{background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', borderRadius: 16, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10}}>
              <FaUser style={{color: '#fff', fontSize: 32}} />
            </div>
            <h1 style={{margin: 0, fontWeight: 900, fontSize: 28}}>{otpStep ? 'Vérification OTP' : 'Connexion Patient'}</h1>
            <span style={{color: '#64748b', fontSize: 15}}>{otpStep ? otpMessage : 'Accédez à votre espace personnel'}</span>
          </div>

          {!otpStep ? (
            <>
              <div style={{width: '100%', marginBottom: 14, position: 'relative'}}>
                <FaEnvelope style={{position: 'absolute', left: 14, top: 16, color: '#a3a3a3', fontSize: 16}} />
                <input type="email" name="email" placeholder="votre.email@exemple.com" value={email} onChange={e => setEmail(e.target.value)} style={{width: '100%', background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px 12px 38px', fontSize: 15}} />
              </div>
              <div style={{width: '100%', marginBottom: 18, position: 'relative'}}>
                <FaLock style={{position: 'absolute', left: 14, top: 16, color: '#a3a3a3', fontSize: 16}} />
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} style={{width: '100%', background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px 12px 38px', fontSize: 15}} />
                <span onClick={() => setShowPassword((v) => !v)} style={{position: 'absolute', right: 14, top: 16, cursor: 'pointer', color: '#a3a3a3'}}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
              </div>
            </>
          ) : (
            <div style={{width: '100%', marginBottom: 18, position: 'relative'}}>
              <FaLock style={{position: 'absolute', left: 14, top: 16, color: '#a3a3a3', fontSize: 16}} />
              <input type="text" name="otp" placeholder="Entrez le code OTP" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{width: '100%', background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px 12px 38px', fontSize: 15, letterSpacing: 4, textAlign: 'center'}} maxLength={6} />
            </div>
          )}

          {error && <div style={{color: '#ec4899', marginBottom: 10, fontWeight: 600}}>{error}</div>}
          <button type="submit" disabled={loading} style={{background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', width: '100%', fontWeight: 700, fontSize: 17, marginBottom: 18, boxShadow: '0 8px 24px rgba(236,72,153,0.13)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Chargement...' : otpStep ? 'Vérifier le code' : 'Se connecter'} &rarr;
          </button>
          {otpStep && (
            <div style={{fontSize: 14, color: '#64748b', marginBottom: 10, cursor: 'pointer'}} onClick={() => { setOtpStep(false); setOtpCode(''); setError(''); }}>
              ← Retour à la connexion
            </div>
          )}
          {!otpStep && (
            <>
              <div style={{width: '100%', textAlign: 'right', marginBottom: 10}}>
                <span style={{fontSize: 14, color: '#ec4899', cursor: 'pointer'}} onClick={() => navigate('/forgot-password?type=patient')}>Mot de passe oublié ?</span>
              </div>
              <div style={{fontSize: 15, color: '#64748b', marginBottom: 10, textAlign: 'center', width: '100%'}}>
                Vous n'avez pas de compte ? <span style={{color: '#ec4899', cursor: 'pointer'}} onClick={() => navigate('/patient-register')}>Créer un compte patient</span>
              </div>
              <div style={{fontSize: 14, color: '#64748b', marginTop: 10, textAlign: 'center', width: '100%', cursor: 'pointer'}} onClick={() => navigate('/')}>← Retour à l'accueil</div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default PatientLogin;
