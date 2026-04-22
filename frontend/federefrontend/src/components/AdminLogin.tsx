

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaIdCard, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { loginMedecinAdmin, setToken, setUser, isAuthenticated, getUser } from "../services/api";
import logo from "../assets/logo.png";
import "./AdminLogin.css";

const AdminLogin: React.FC = () => {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      if (user && user.role === 'ROLE_ADMIN') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user) {
        navigate('/profile', { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!nom || !prenom || !id || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (isNaN(Number(id))) {
      setError("L'identifiant doit être un nombre.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginMedecinAdmin({ nom, prenom, id: Number(id), motDePasse: password });
      if (res.role !== 'ROLE_ADMIN') {
        setError("Accès réservé aux administrateurs.");
        return;
      }
      setToken(res.token);
      setUser(res);
      setSuccess(true);
      setTimeout(() => navigate("/admin-dashboard"), 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display: 'flex', minHeight: '100vh'}}>
      {/* Colonne gauche (présentation) */}
      <div style={{flex: 1.2, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0 0 0 70px', position: 'relative'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40}}>
          <img src={logo} alt="MediCare+" style={{width: 54, height: 54, borderRadius: 14, background: '#fff', objectFit: 'cover'}} />
          <div>
            <h3 style={{margin: 0, fontSize: 30, fontWeight: 800, color: '#fff'}}>MediCare+</h3>
            <span style={{fontSize: 15, color: '#cbd5f5'}}>Gestion Médicale</span>
          </div>
        </div>
        <div style={{background: '#fff', color: '#16a34a', borderRadius: 16, padding: '14px 28px', fontWeight: 700, fontSize: 20, display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 30, boxShadow: '0 6px 24px rgba(34,197,94,0.10)'}}>
          <FaShieldAlt style={{fontSize: 26}} />
          <div>
            <strong>Espace Administrateur</strong>
            <div style={{fontWeight: 400, fontSize: 15}}>Accès sécurisé</div>
          </div>
        </div>
        <h1 style={{fontSize: 36, fontWeight: 900, margin: '0 0 18px 0'}}>Gérez votre plateforme en toute sécurité</h1>
        <ul style={{listStyle: 'none', padding: 0, margin: '0 0 30px 0'}}>
          <li style={{fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10}}><FaCheckCircle style={{color: '#fff', marginRight: 8}} /> Gestion complète des utilisateurs</li>
          <li style={{fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10}}><FaCheckCircle style={{color: '#fff', marginRight: 8}} /> Contrôle des rôles et permissions</li>
          <li style={{fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10}}><FaCheckCircle style={{color: '#fff', marginRight: 8}} /> Supervision et statistiques en temps réel</li>
          <li style={{fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10}}><FaCheckCircle style={{color: '#fff', marginRight: 8}} /> Maintenance et sécurité de la plateforme</li>
        </ul>
        <div style={{background: 'rgba(22,163,74,0.18)', borderRadius: 18, padding: '18px 28px', color: '#fff', fontWeight: 600, fontSize: 17, marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 14, border: '1.5px solid #a7f3d0'}}>
          <FaExclamationTriangle style={{color: '#facc15', fontSize: 22, marginTop: 2}} />
          <div>
            <div style={{fontWeight: 700}}>Accès restreint</div>
            <div style={{fontWeight: 400, fontSize: 15}}>Cet espace est réservé aux administrateurs autorisés uniquement.</div>
          </div>
        </div>
        <div style={{marginTop: 30, color: '#d1fae5', fontSize: 15}}>
          © 2026 MediCare+ • Sécurité et conformité garanties
        </div>
      </div>

      {/* Colonne droite (formulaire) */}
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #f6fbff 0%, #fff 100%)'}}>
        <form onSubmit={handleSubmit} style={{background: '#fff', borderRadius: 22, boxShadow: '0 8px 40px rgba(15,23,42,0.13)', padding: '44px 38px 32px 38px', maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{background: 'linear-gradient(135deg, #16a34a, #22c55e)', borderRadius: 16, width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18}}>
            <FaShieldAlt style={{color: '#fff', fontSize: 38}} />
          </div>
          <h1 style={{fontSize: 36, fontWeight: 900, margin: '0 0 8px 0', color: '#111'}}>Connexion Admin</h1>
          <p style={{color: '#64748b', marginBottom: 28, fontSize: 17}}>Accédez au panneau d'administration</p>

          <div style={{width: '100%', marginBottom: 18}}>
            <label style={{fontWeight: 600, color: '#222', fontSize: 15, marginBottom: 6, display: 'block'}}>Nom</label>
            <div style={{display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '0 14px', height: 48, marginBottom: 6}}>
              <FaUser style={{color: '#94a3b8', fontSize: 18, marginRight: 8}} />
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Votre nom"
                autoComplete="family-name"
                required
                style={{border: 'none', background: 'transparent', outline: 'none', fontSize: 16, width: '100%', color: '#222'}} />
            </div>
          </div>

          <div style={{width: '100%', marginBottom: 18}}>
            <label style={{fontWeight: 600, color: '#222', fontSize: 15, marginBottom: 6, display: 'block'}}>Prénom</label>
            <div style={{display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '0 14px', height: 48, marginBottom: 6}}>
              <FaUser style={{color: '#94a3b8', fontSize: 18, marginRight: 8}} />
              <input
                type="text"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                autoComplete="given-name"
                required
                style={{border: 'none', background: 'transparent', outline: 'none', fontSize: 16, width: '100%', color: '#222'}} />
            </div>
          </div>

          <div style={{width: '100%', marginBottom: 18}}>
            <label style={{fontWeight: 600, color: '#222', fontSize: 15, marginBottom: 6, display: 'block'}}>Identifiant (ID)</label>
            <div style={{display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '0 14px', height: 48, marginBottom: 6}}>
              <FaIdCard style={{color: '#94a3b8', fontSize: 18, marginRight: 8}} />
              <input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="Votre identifiant numérique"
                required
                style={{border: 'none', background: 'transparent', outline: 'none', fontSize: 16, width: '100%', color: '#222'}} />
            </div>
          </div>

          <div style={{width: '100%', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <label style={{fontWeight: 600, color: '#222', fontSize: 15}}>Mot de passe</label>
            <a href="#" style={{color: '#16a34a', fontSize: 15, textDecoration: 'none', fontWeight: 500}}></a>
          </div>
          <div style={{display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '0 14px', height: 48, width: '100%', marginBottom: 18}}>
            <FaLock style={{color: '#94a3b8', fontSize: 18, marginRight: 8}} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{border: 'none', background: 'transparent', outline: 'none', fontSize: 16, width: '100%', color: '#222'}} />
            <span
              style={{cursor: 'pointer', color: '#94a3b8', fontSize: 18, marginLeft: 8}}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <div style={{color: '#dc2626', background: '#fef2f2', borderRadius: 8, padding: '8px 14px', width: '100%', marginBottom: 10, fontWeight: 500, fontSize: 15}}>{error}</div>}
          {success && <div style={{color: '#16a34a', background: '#f0fdf4', borderRadius: 8, padding: '8px 14px', width: '100%', marginBottom: 10, fontWeight: 500, fontSize: 15}}>Connexion réussie !</div>}

          <button type="submit" disabled={loading} style={{width: '100%', background: 'linear-gradient(90deg, #16a34a, #22c55e)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 20, margin: '18px 0 0 0', boxShadow: '0 8px 24px rgba(34,197,94,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.2s', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Connexion...' : 'Se connecter'} {!loading && <span style={{fontSize: 22, marginLeft: 8}}>&rarr;</span>}
          </button>

          <div style={{background: '#f8fafc', borderRadius: 14, padding: '18px 0', margin: '28px 0 0 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#16a34a', fontWeight: 600, fontSize: 16, border: '1.5px solid #d1fae5'}}>
            <FaLock style={{fontSize: 20}} /> 
          </div>

          <div style={{marginTop: 22, width: '100%', textAlign: 'center'}}>
            <a href="#" onClick={e => {e.preventDefault(); navigate("/");}} style={{color: '#334155', fontSize: 15, textDecoration: 'none', fontWeight: 500}}>
              &larr; Retour à l'accueil
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
