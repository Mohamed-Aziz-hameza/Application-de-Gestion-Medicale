import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle, FaTimesCircle, FaArrowRight } from 'react-icons/fa';
import { validateResetToken, resetPassword } from '../services/api';
import logo from '../assets/logo.png';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('Aucun token de réinitialisation trouvé.');
      setValidating(false);
      return;
    }

    (async () => {
      try {
        await validateResetToken(token);
        setTokenValid(true);
      } catch (err: unknown) {
        setTokenError(err instanceof Error ? err.message : 'Le lien de réinitialisation est invalide ou a expiré.');
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: '#e5e7eb' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 20, label: 'Très faible', color: '#ef4444' };
    if (score === 2) return { level: 40, label: 'Faible', color: '#f97316' };
    if (score === 3) return { level: 60, label: 'Moyen', color: '#eab308' };
    if (score === 4) return { level: 80, label: 'Fort', color: '#22c55e' };
    return { level: 100, label: 'Très fort', color: '#16a34a' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, newPassword });
      setSuccess(res.message || 'Votre mot de passe a été réinitialisé avec succès !');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-root">
      {/* Left column */}
      <div className="rp-left">
        <div className="rp-left-content">
          <div className="rp-brand">
            <img src={logo} alt="MediCare+" />
            <div>
              <h3>MediCare+</h3>
              <span>Gestion Médicale</span>
            </div>
          </div>
          <div className="rp-badge">
            <FaShieldAlt style={{ fontSize: 20 }} />
            Réinitialisation sécurisée
          </div>
          <h1 className="rp-title">Nouveau mot de passe</h1>
          <ul className="rp-features">
            <li><FaCheckCircle /> Minimum 6 caractères</li>
            <li><FaCheckCircle /> Mélangez majuscules et minuscules</li>
            <li><FaCheckCircle /> Ajoutez des chiffres et symboles</li>
            <li><FaCheckCircle /> Évitez les mots de passe courants</li>
          </ul>
          <div className="rp-footer">
            © 2026 MediCare+ • Votre santé, notre priorité
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="rp-right">
        <div className="rp-form">
          <div className="rp-form-icon">
            <FaLock style={{ color: '#fff', fontSize: 32 }} />
          </div>

          {validating ? (
            <div className="rp-loading">
              <div className="rp-spinner"></div>
              <p style={{ color: '#64748b' }}>Vérification du lien...</p>
            </div>
          ) : !tokenValid ? (
            <div className="rp-token-error">
              <FaTimesCircle />
              <h2>Lien invalide</h2>
              <p>{tokenError}</p>
              <div className="rp-link" onClick={() => navigate('/patient-login')}>
                Connexion Patient
              </div>
              <div className="rp-link" onClick={() => navigate('/doctor-login')}>
                Connexion Médecin
              </div>
              <div className="rp-link" onClick={() => navigate('/')}>
                ← Retour à l'accueil
              </div>
            </div>
          ) : success ? (
            <>
              <h1>Mot de passe réinitialisé</h1>
              <div className="rp-success">
                <FaCheckCircle style={{ fontSize: 20 }} /> {success}
              </div>
              <div className="rp-link" onClick={() => navigate('/patient-login')}>
                Connexion <span>Patient</span>
              </div>
              <div className="rp-link" onClick={() => navigate('/doctor-login')}>
                Connexion <span>Médecin</span>
              </div>
              <div className="rp-link" onClick={() => navigate('/')}>
                ← Retour à l'accueil
              </div>
            </>
          ) : (
            <>
              <h1>Nouveau mot de passe</h1>
              <p className="rp-form-subtitle">Choisissez un mot de passe sécurisé</p>

              <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="rp-input-group">
                  <FaLock className="rp-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button type="button" className="rp-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {newPassword && (
                  <div className="rp-strength">
                    <div className="rp-strength-bar">
                      <div
                        className="rp-strength-fill"
                        style={{ width: `${strength.level}%`, background: strength.color }}
                      />
                    </div>
                    <span className="rp-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}

                <div className="rp-input-group">
                  <FaLock className="rp-icon-left" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button type="button" className="rp-eye-btn" onClick={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {error && <div className="rp-error">{error}</div>}

                <button type="submit" className="rp-submit-btn" disabled={loading}>
                  {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'} {!loading && <FaArrowRight />}
                </button>
              </form>

              <div className="rp-link" onClick={() => navigate('/')}>
                ← Retour à l'accueil
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
