import { useState } from "react";
import "./PatientRegister.css";
import logo from "../assets/logo.png";
import doctorImg from "../assets/doctor.jpg";
import { FaStethoscope, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { registerMedecin } from "../services/api";

const DoctorRegister: React.FC = () => {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    specialite: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!form.nom || !form.prenom || !form.email || !form.password || !form.confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await registerMedecin({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        motDePasse: form.password,
        specialite: form.specialite || undefined,
      });
      setSuccessMsg(res.message || "Inscription réussie !");
      setTimeout(() => navigate("/doctor-login"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: 'linear-gradient(90deg, #e7f2ff 0%, #f6fbff 50%, #fff 100%)'}}>
      {/* Colonne gauche */}
      <div style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, #0b5ed7 0%, #0ea5e9 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 0 0 70px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Image de fond floue */}
        <img src={doctorImg} alt="Médecin" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(1px) brightness(0.7)',
          zIndex: 0,
        }} />
        <div style={{position: 'relative', zIndex: 1, width: '100%'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40}}>
            <img src={logo} alt="MediCare+" style={{width: 54, height: 54, borderRadius: 14, background: '#fff', objectFit: 'cover'}} />
            <div>
              <h3 style={{margin: 0}}>MediCare+</h3>
              <span style={{fontSize: 13}}>Gestion Médicale</span>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.13)', borderRadius: 12, padding: '8px 18px', marginBottom: 24, fontWeight: 600}}>
            <FaStethoscope style={{fontSize: 20}} /> Rejoignez-nous <span style={{fontWeight: 400, fontSize: 13, opacity: 0.8}}>&nbsp;Espace Médecin</span>
          </div>
          <h1 style={{fontSize: 32, fontWeight: 900, margin: 0, marginBottom: 18}}>Inscrivez-vous pour gérer vos patients</h1>
          <ul style={{listStyle: 'none', padding: 0, margin: 0, color: '#fff', fontSize: 17, fontWeight: 500, marginBottom: 30}}>
            <li style={{marginBottom: 10}}><span style={{color: '#fff', marginRight: 8}}>✔</span> Inscription gratuite et sécurisée</li>
            <li style={{marginBottom: 10}}><span style={{color: '#fff', marginRight: 8}}>✔</span> Accès à un espace professionnel dédié</li>
            <li style={{marginBottom: 10}}><span style={{color: '#fff', marginRight: 8}}>✔</span> Gestion intelligente des rendez-vous</li>
            <li><span style={{color: '#fff', marginRight: 8}}>✔</span> Support technique dédié</li>
          </ul>
          <div style={{marginTop: 40, color: '#e0e7ef', fontSize: 14}}>
            © 2026 MediCare+ • Plateforme médicale
          </div>
        </div>
      </div>
      {/* Colonne droite */}
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #f6fbff 0%, #fff 100%)'}}>
        <form onSubmit={handleSubmit} style={{background: '#fff', borderRadius: 22, boxShadow: '0 8px 40px rgba(15,23,42,0.13)', padding: '44px 38px 32px 38px', maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24}}>
            <div style={{background: 'linear-gradient(135deg, #0b5ed7 0%, #0ea5e9 100%)', borderRadius: 16, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10}}>
              <FaStethoscope style={{color: '#fff', fontSize: 32}} />
            </div>
            <h1 style={{margin: 0, fontWeight: 900, fontSize: 28}}>Inscription Médecin</h1>
            <span style={{color: '#64748b', fontSize: 15}}>Créez votre compte professionnel</span>
          </div>
          <div style={{display: 'flex', gap: 12, width: '100%', marginBottom: 14}}>
            <input type="text" name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} style={{flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 15}} />
            <input type="text" name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} style={{flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 15}} />
          </div>
          <div style={{width: '100%', marginBottom: 14, position: 'relative'}}>
            <FaEnvelope style={{position: 'absolute', left: 14, top: 16, color: '#a3a3a3', fontSize: 16}} />
            <input type="email" name="email" placeholder="votre.email@exemple.com" value={form.email} onChange={handleChange} style={{width: '100%', background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px 12px 38px', fontSize: 15}} />
          </div>

          <div style={{width: '100%', marginBottom: 14, position: 'relative'}}>
            <FaStethoscope style={{position: 'absolute', left: 14, top: 16, color: '#a3a3a3', fontSize: 16}} />
            <input type="text" name="specialite" placeholder="Spécialité médicale" value={form.specialite} onChange={handleChange} style={{width: '100%', background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px 12px 38px', fontSize: 15}} />
          </div>
          <div style={{width: '100%', marginBottom: 14, position: 'relative'}}>
            <FaLock style={{position: 'absolute', left: 14, top: 16, color: '#a3a3a3', fontSize: 16}} />
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} style={{width: '100%', background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px 12px 38px', fontSize: 15}} />
            <span onClick={() => setShowPassword((v) => !v)} style={{position: 'absolute', right: 14, top: 16, cursor: 'pointer', color: '#a3a3a3'}}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
          </div>
          <div style={{width: '100%', marginBottom: 18, position: 'relative'}}>
            <FaLock style={{position: 'absolute', left: 14, top: 16, color: '#a3a3a3', fontSize: 16}} />
            <input type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Confirmer mot de passe" value={form.confirmPassword} onChange={handleChange} style={{width: '100%', background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '12px 14px 12px 38px', fontSize: 15}} />
            <span onClick={() => setShowConfirm((v) => !v)} style={{position: 'absolute', right: 14, top: 16, cursor: 'pointer', color: '#a3a3a3'}}>{showConfirm ? <FaEyeSlash /> : <FaEye />}</span>
          </div>
          {error && <div style={{color: '#0b5ed7', marginBottom: 10, fontWeight: 600}}>{error}</div>}
          {successMsg && <div style={{color: '#16a34a', marginBottom: 10, fontWeight: 600}}>{successMsg}</div>}
          <button type="submit" disabled={loading} style={{background: 'linear-gradient(90deg, #0d6efd 0%, #0ea5e9 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', width: '100%', fontWeight: 700, fontSize: 17, marginBottom: 18, boxShadow: '0 8px 24px rgba(13,110,253,0.13)', cursor: 'pointer', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Inscription...' : 'Créer mon compte médecin →'}
          </button>
          <div style={{fontSize: 15, color: '#64748b', marginBottom: 10}}>
            Vous avez déjà un compte ? <span style={{color: '#0b5ed7', cursor: 'pointer'}} onClick={() => navigate('/doctor-login')}>Se connecter</span>
          </div>
          <div style={{fontSize: 14, color: '#64748b', marginTop: 10, textAlign: 'center', width: '100%', cursor: 'pointer'}} onClick={() => navigate('/')}>← Retour à l'accueil</div>
        </form>
      </div>
    </div>
  );
};

export default DoctorRegister;