import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaStethoscope, FaArrowRight } from 'react-icons/fa';
import { forgotPassword } from '../services/api';
import logo from '../assets/logo.png';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'patient'; // 'patient' | 'doctor'
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isDoctor = type === 'doctor';

  const gradient = isDoctor
    ? 'linear-gradient(135deg, #0b5ed7 0%, #0ea5e9 100%)'
    : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)';

  const accentColor = isDoctor ? '#0b5ed7' : '#ec4899';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      setSuccess(res.message || 'Un lien de réinitialisation a été envoyé à votre adresse email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la demande.');
    } finally {
      setLoading(false);
    }
  };

  const loginPath = isDoctor ? '/doctor-login' : '/patient-login';

  return (
    <div className="fp-root">
      {/* Left column */}
      <div className="fp-left" style={{ background: gradient }}>
        <div className="fp-left-content">
          <div className="fp-brand">
            <img src={logo} alt="MediCare+" />
            <div>
              <h3>MediCare+</h3>
              <span>Gestion Médicale</span>
            </div>
          </div>
          <div className="fp-badge">
            {isDoctor ? <FaStethoscope style={{ fontSize: 20 }} /> : <FaUser style={{ fontSize: 20 }} />}
            {isDoctor ? 'Espace Médecin' : 'Espace Patient'}
          </div>
          <h1 className="fp-title">Mot de passe oublié ?</h1>
          <p className="fp-description">
            Pas de panique ! Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe en toute sécurité.
          </p>
          <div className="fp-footer">
            © 2026 MediCare+ • Votre santé, notre priorité
          </div>
        </div>
      </div>

      {/* Right column - form */}
      <div className="fp-right">
        <form className="fp-form" onSubmit={handleSubmit}>
          <div className="fp-form-icon" style={{ background: gradient }}>
            <FaLock style={{ color: '#fff', fontSize: 32 }} />
          </div>
          <h1>Réinitialisation</h1>
          <p className="fp-form-subtitle">
            Entrez l'email associé à votre compte {isDoctor ? 'médecin' : 'patient'}
          </p>

          {!success ? (
            <>
              <div className="fp-input-group">
                <FaEnvelope />
                <input
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <div className="fp-error">{error}</div>}

              <button
                type="submit"
                className="fp-submit-btn"
                style={{ background: gradient, boxShadow: `0 8px 24px ${accentColor}22` }}
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'} {!loading && <FaArrowRight />}
              </button>
            </>
          ) : (
            <div className="fp-success">
              ✅ {success}
            </div>
          )}

          <div className="fp-back-link" onClick={() => navigate(loginPath)}>
            ← Retour à la connexion
          </div>
          <div className="fp-back-link" onClick={() => navigate('/')}>
            ← Retour à l'accueil
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
