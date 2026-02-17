// Page de profil utilisateur - Connectée au backend

import { useState, useCallback, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaUser, FaVials, FaSignOutAlt, FaCheck, FaEdit, FaLock } from 'react-icons/fa';
import { getMyProfile, updateMyProfile, isAuthenticated, logout, watchSessionExpiry, getSessionTimeRemaining } from '../services/api';
import type { ProfileUpdateRequest } from '../services/api';
import './ProfilePage.css';

// ─── Types ──────────────────────────────────────────────────────
type TypeUtilisateur = 'Medecin' | 'Patient' | 'Administrateur';

interface ProfileFormData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  confirmMotDePasse: string;
  typeUtilisateur: TypeUtilisateur;
  dateNaissance: string;
  telephone: string;
  specialite: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface UtilisateurBase {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  typeUtilisateur: TypeUtilisateur;
}

interface Patient extends UtilisateurBase {
  typeUtilisateur: 'Patient';
  dateNaissance: string | null;
  telephone: string | null;
}

interface Medecin extends UtilisateurBase {
  typeUtilisateur: 'Medecin';
  specialite: string | null;
}

interface Administrateur extends UtilisateurBase {
  typeUtilisateur: 'Administrateur';
}

type UtilisateurComplet = Patient | Medecin | Administrateur;

// ─── Validation (locale) ────────────────────────────────────────
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone: string): boolean => {
  if (!phone) return true;
  return /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(phone.replace(/\s/g, ''));
};

const isValidDateNaissance = (dateStr: string): boolean => {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120);
  return date <= today && date >= minDate && !isNaN(date.getTime());
};

const isValidPassword = (pwd: string): boolean => pwd.length >= 6;
const isNotEmpty = (v: string): boolean => v.trim().length > 0;
const hasMaxLength = (v: string, max: number): boolean => v.trim().length <= max;

const validateProfileFormEdit = (formData: ProfileFormData, validatePassword: boolean): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!isNotEmpty(formData.nom)) errors.nom = 'Le nom est requis';
  else if (!hasMaxLength(formData.nom, 100)) errors.nom = 'Le nom ne peut pas dépasser 100 caractères';

  if (!isNotEmpty(formData.prenom)) errors.prenom = 'Le prénom est requis';
  else if (!hasMaxLength(formData.prenom, 100)) errors.prenom = 'Le prénom ne peut pas dépasser 100 caractères';

  if (!isNotEmpty(formData.email)) errors.email = "L'email est requis";
  else if (!isValidEmail(formData.email)) errors.email = "Format d'email invalide";
  else if (!hasMaxLength(formData.email, 100)) errors.email = "L'email ne peut pas dépasser 100 caractères";

  if (validatePassword) {
    if (!isNotEmpty(formData.motDePasse)) errors.motDePasse = 'Le mot de passe est requis';
    else if (!isValidPassword(formData.motDePasse)) errors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    if (formData.motDePasse !== formData.confirmMotDePasse) errors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
  }

  if (formData.typeUtilisateur === 'Patient') {
    if (formData.telephone && !isValidPhone(formData.telephone)) errors.telephone = 'Format de téléphone invalide';
    if (formData.telephone && !hasMaxLength(formData.telephone, 20)) errors.telephone = 'Le téléphone ne peut pas dépasser 20 caractères';
    if (formData.dateNaissance && !isValidDateNaissance(formData.dateNaissance)) errors.dateNaissance = 'Date de naissance invalide';
  }

  if (formData.typeUtilisateur === 'Medecin') {
    if (formData.specialite && !hasMaxLength(formData.specialite, 100)) errors.specialite = 'La spécialité ne peut pas dépasser 100 caractères';
  }

  return errors;
};

const hasErrors = (errors: ValidationErrors): boolean => Object.keys(errors).length > 0;

// ─── Hook connecté au backend ───────────────────────────────────
function useProfile() {
  const navigate = useNavigate();
  const [utilisateur, setUtilisateur] = useState<UtilisateurComplet | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    nom: '', prenom: '', email: '', motDePasse: '', confirmMotDePasse: '',
    typeUtilisateur: 'Patient', dateNaissance: '', telephone: '', specialite: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [wantsPasswordChange, setWantsPasswordChange] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const populateFormFromUser = (user: UtilisateurComplet) => {
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      motDePasse: '',
      confirmMotDePasse: '',
      typeUtilisateur: user.typeUtilisateur,
      dateNaissance: user.typeUtilisateur === 'Patient' ? (user as Patient).dateNaissance || '' : '',
      telephone: user.typeUtilisateur === 'Patient' ? (user as Patient).telephone || '' : '',
      specialite: user.typeUtilisateur === 'Medecin' ? (user as Medecin).specialite || '' : '',
    });
    setWantsPasswordChange(false);
  };

  // Charger le profil depuis le backend
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/patient-login');
      return;
    }

    // Watch for session expiry
    const stopWatching = watchSessionExpiry(() => {
      navigate('/patient-login');
    });

    (async () => {
      try {
        const profile = await getMyProfile();
        const user: UtilisateurComplet = profile.typeUtilisateur === 'Patient'
          ? { id: profile.id, nom: profile.nom, prenom: profile.prenom, email: profile.email, typeUtilisateur: 'Patient', dateNaissance: profile.dateNaissance || null, telephone: profile.telephone || null }
          : profile.typeUtilisateur === 'Medecin'
            ? { id: profile.id, nom: profile.nom, prenom: profile.prenom, email: profile.email, typeUtilisateur: 'Medecin', specialite: profile.specialite || null }
            : { id: profile.id, nom: profile.nom, prenom: profile.prenom, email: profile.email, typeUtilisateur: 'Administrateur' };
        setUtilisateur(user);
        populateFormFromUser(user);
      } catch {
        await logout();
        navigate('/patient-login');
      } finally {
        setIsLoading(false);
      }
    })();

    return stopWatching;
  }, [navigate]);

  const togglePasswordChange = useCallback(() => {
    setWantsPasswordChange(prev => {
      if (prev) {
        setFormData(f => ({ ...f, motDePasse: '', confirmMotDePasse: '' }));
      }
      return !prev;
    });
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!utilisateur) {
      setNotification({ type: 'error', message: 'Aucun utilisateur à modifier.' });
      return;
    }

    const validationErrors = validateProfileFormEdit(formData, wantsPasswordChange);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      setNotification({ type: 'error', message: 'Veuillez corriger les erreurs du formulaire.' });
      return;
    }

    setIsSaving(true);
    try {
      const payload: ProfileUpdateRequest = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
      };
      if (wantsPasswordChange && formData.motDePasse) {
        payload.motDePasse = formData.motDePasse;
      }
      if (formData.typeUtilisateur === 'Patient') {
        payload.dateNaissance = formData.dateNaissance || undefined;
        payload.telephone = formData.telephone || undefined;
      }
      if (formData.typeUtilisateur === 'Medecin') {
        payload.specialite = formData.specialite || undefined;
      }

      const updated = await updateMyProfile(payload);
      const updatedUser: UtilisateurComplet = updated.typeUtilisateur === 'Patient'
        ? { id: updated.id, nom: updated.nom, prenom: updated.prenom, email: updated.email, typeUtilisateur: 'Patient', dateNaissance: updated.dateNaissance || null, telephone: updated.telephone || null }
        : updated.typeUtilisateur === 'Medecin'
          ? { id: updated.id, nom: updated.nom, prenom: updated.prenom, email: updated.email, typeUtilisateur: 'Medecin', specialite: updated.specialite || null }
          : { id: updated.id, nom: updated.nom, prenom: updated.prenom, email: updated.email, typeUtilisateur: 'Administrateur' };

      setUtilisateur(updatedUser);
      populateFormFromUser(updatedUser);
      setIsEditing(false);
      setNotification({
        type: 'success',
        message: wantsPasswordChange ? 'Profil et mot de passe mis à jour avec succès!' : 'Profil mis à jour avec succès!',
      });
    } catch (err: unknown) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = useCallback(() => { setIsEditing(true); setErrors({}); }, []);

  const cancelEditing = useCallback(() => {
    if (utilisateur) populateFormFromUser(utilisateur);
    setIsEditing(false);
    setErrors({});
  }, [utilisateur]);

  const clearNotification = useCallback(() => setNotification(null), []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return {
    utilisateur, formData, errors, isLoading, isSaving,
    isEditing, wantsPasswordChange, notification,
    handleChange, handleSubmit, startEditing, cancelEditing,
    clearNotification, togglePasswordChange, handleLogout,
  };
}



// ─── Composant principal ────────────────────────────────────────
export default function ProfilePage() {
  const {
    utilisateur, formData, errors, isLoading, isSaving,
    isEditing, wantsPasswordChange, notification,
    handleChange, handleSubmit, startEditing, cancelEditing,
    clearNotification, togglePasswordChange, handleLogout,
  } = useProfile();

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Patient: 'Patient',
      Medecin: 'Médecin',
      Administrateur: 'Administrateur',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="pd-root">
        <div className="pd-loading"><div className="pd-spinner"></div></div>
      </div>
    );
  }

  if (!utilisateur) {
    return (
      <div className="pd-root">
        <div className="pd-empty">
          <FaUser size={64} />
          <h2>Aucun profil</h2>
          <p>Le profil sera chargé depuis une autre page.</p>
        </div>
      </div>
    );
  }

  const isMedecin = formData.typeUtilisateur === 'Medecin';
  const isPatient = formData.typeUtilisateur === 'Patient';
  const roleColor = isMedecin ? '#16a34a' : '#4f8cff';
  const roleBg = isMedecin ? '#dcfce7' : '#dbeafe';
  const roleGradient = isMedecin
    ? 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)'
    : 'linear-gradient(90deg, #4f8cff 0%, #2563eb 100%)';
  const initials = `${(formData.prenom?.[0] || '').toUpperCase()}${(formData.nom?.[0] || '').toUpperCase()}`;

  return (
    <div className="pd-root">
      {/* Notification */}
      {notification && (
        <div className={`pd-notification ${notification.type}`} onClick={clearNotification}>
          {notification.type === 'success' ? <FaCheck /> : '⚠️'}
          {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="pd-sidebar">
        <div>
          <div className="pd-sidebar-brand">
            <div className="pd-sidebar-logo" style={{ background: roleGradient }}>
              {isMedecin
                ? <FaUserMd size={32} color="#fff" />
                : <FaUser size={32} color="#fff" />
              }
            </div>
            <div>
              <div className="pd-sidebar-title">MediCare</div>
              <div className="pd-sidebar-subtitle">Mon Espace</div>
            </div>
          </div>
          <nav className="pd-sidebar-nav">
            <button className="pd-sidebar-btn" style={{ background: roleGradient, color: '#fff', boxShadow: `0 4px 24px ${roleColor}22` }}>
              <FaUser /> Mon Profil
            </button>
          </nav>
        </div>
        <div className="pd-sidebar-bottom">
          <div className="pd-sidebar-user">
            <div className="pd-sidebar-user-avatar" style={{ background: roleColor }}>{initials}</div>
            <div>
              <div className="pd-sidebar-user-name">{formData.prenom} {formData.nom}</div>
              <div className="pd-sidebar-user-email">{formData.email}</div>
            </div>
          </div>
          <button className="pd-sidebar-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pd-main">
        {/* Header */}
        <div className="pd-header">
          <div>
            <div className="pd-header-title">Mon Profil</div>
            <div className="pd-header-subtitle">Gérer vos informations personnelles</div>
          </div>
          <div className="pd-header-actions">
            <span className="pd-role-badge" style={{ background: roleBg, color: roleColor }}>{getTypeLabel(formData.typeUtilisateur)}</span>
            <div className="pd-header-avatar" style={{ background: roleColor }}>{initials}</div>
          </div>
        </div>

        {/* View mode */}
        {!isEditing && (
          <>
            <div className="pd-actions-bar">
              <button type="button" className="pd-btn pd-btn-edit" style={{ background: roleGradient }} onClick={startEditing}>
                <FaEdit /> Modifier le profil
              </button>
            </div>

            {/* Personal info card */}
            <div className="pd-card">
              <div className="pd-card-title"><FaUser /> Informations personnelles</div>
              <div className="pd-card-grid">
                <div className="pd-card-item">
                  <span className="pd-card-label">Prénom</span>
                  <span className="pd-card-value">{formData.prenom}</span>
                </div>
                <div className="pd-card-item">
                  <span className="pd-card-label">Nom</span>
                  <span className="pd-card-value">{formData.nom}</span>
                </div>
                <div className="pd-card-item">
                  <span className="pd-card-label">Email</span>
                  <span className="pd-card-value">{formData.email}</span>
                </div>
                <div className="pd-card-item">
                  <span className="pd-card-label">Type de compte</span>
                  <span className="pd-card-value">
                    <span className="pd-role-badge-sm" style={{ background: roleBg, color: roleColor }}>{getTypeLabel(formData.typeUtilisateur)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Patient info card */}
            {isPatient && (
              <div className="pd-card">
                <div className="pd-card-title"><FaVials /> Informations Patient</div>
                <div className="pd-card-grid">
                  <div className="pd-card-item">
                    <span className="pd-card-label">Date de naissance</span>
                    <span className="pd-card-value">{formData.dateNaissance || 'Non renseignée'}</span>
                  </div>
                  <div className="pd-card-item">
                    <span className="pd-card-label">Téléphone</span>
                    <span className="pd-card-value">{formData.telephone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Medecin info card */}
            {isMedecin && (
              <div className="pd-card">
                <div className="pd-card-title"><FaUserMd /> Informations Médecin</div>
                <div className="pd-card-grid">
                  <div className="pd-card-item">
                    <span className="pd-card-label">Spécialité</span>
                    <span className="pd-card-value">{formData.specialite || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit mode */}
        {isEditing && (
          <form onSubmit={handleSubmit}>
            {/* Personal info */}
            <div className="pd-card">
              <div className="pd-card-title"><FaUser /> Informations personnelles</div>
              <div className="pd-form-grid">
                <div className="pd-form-group">
                  <label htmlFor="prenom">Prénom <span className="pd-required">*</span></label>
                  <input type="text" id="prenom" name="prenom" value={formData.prenom} onChange={handleChange}
                    className={errors.prenom ? 'pd-input-error' : ''} placeholder="Votre prénom" maxLength={100} />
                  {errors.prenom && <span className="pd-error-msg">{errors.prenom}</span>}
                </div>
                <div className="pd-form-group">
                  <label htmlFor="nom">Nom <span className="pd-required">*</span></label>
                  <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange}
                    className={errors.nom ? 'pd-input-error' : ''} placeholder="Votre nom" maxLength={100} />
                  {errors.nom && <span className="pd-error-msg">{errors.nom}</span>}
                </div>
                <div className="pd-form-group">
                  <label htmlFor="email">Email <span className="pd-required">*</span></label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                    className={errors.email ? 'pd-input-error' : ''} placeholder="votre@email.com" maxLength={100} />
                  {errors.email && <span className="pd-error-msg">{errors.email}</span>}
                </div>
                <div className="pd-form-group">
                  <label htmlFor="typeUtilisateur">Type de compte</label>
                  <input type="text" id="typeUtilisateur" value={getTypeLabel(formData.typeUtilisateur)} disabled />
                </div>
              </div>
            </div>

            {/* Patient fields */}
            {isPatient && (
              <div className="pd-card">
                <div className="pd-card-title"><FaVials /> Informations Patient</div>
                <div className="pd-form-grid">
                  <div className="pd-form-group">
                    <label htmlFor="dateNaissance">Date de naissance</label>
                    <input type="date" id="dateNaissance" name="dateNaissance" value={formData.dateNaissance}
                      onChange={handleChange} className={errors.dateNaissance ? 'pd-input-error' : ''} />
                    {errors.dateNaissance && <span className="pd-error-msg">{errors.dateNaissance}</span>}
                  </div>
                  <div className="pd-form-group">
                    <label htmlFor="telephone">Téléphone</label>
                    <input type="tel" id="telephone" name="telephone" value={formData.telephone}
                      onChange={handleChange} className={errors.telephone ? 'pd-input-error' : ''} placeholder="06 12 34 56 78" maxLength={20} />
                    {errors.telephone && <span className="pd-error-msg">{errors.telephone}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Medecin fields */}
            {isMedecin && (
              <div className="pd-card">
                <div className="pd-card-title"><FaUserMd /> Informations Médecin</div>
                <div className="pd-form-grid">
                  <div className="pd-form-group pd-form-full">
                    <label htmlFor="specialite">Spécialité</label>
                    <input type="text" id="specialite" name="specialite" value={formData.specialite}
                      onChange={handleChange} className={errors.specialite ? 'pd-input-error' : ''} placeholder="Cardiologie, Pédiatrie, Dermatologie..." maxLength={100} />
                    {errors.specialite && <span className="pd-error-msg">{errors.specialite}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Security / password section */}
            <div className="pd-card pd-card-security">
              <div className="pd-security-toggle">
                <div className="pd-card-title"><FaLock /> Sécurité</div>
                <label className="pd-toggle-label">
                  <input type="checkbox" checked={wantsPasswordChange} onChange={togglePasswordChange} />
                  <span>Changer le mot de passe</span>
                </label>
              </div>
              {wantsPasswordChange && (
                <div className="pd-form-grid" style={{ marginTop: 20 }}>
                  <div className="pd-form-group">
                    <label htmlFor="motDePasse">Nouveau mot de passe <span className="pd-required">*</span></label>
                    <input type="password" id="motDePasse" name="motDePasse" value={formData.motDePasse}
                      onChange={handleChange} className={errors.motDePasse ? 'pd-input-error' : ''} placeholder="Minimum 6 caractères" maxLength={100} />
                    {errors.motDePasse && <span className="pd-error-msg">{errors.motDePasse}</span>}
                  </div>
                  <div className="pd-form-group">
                    <label htmlFor="confirmMotDePasse">Confirmer <span className="pd-required">*</span></label>
                    <input type="password" id="confirmMotDePasse" name="confirmMotDePasse" value={formData.confirmMotDePasse}
                      onChange={handleChange} className={errors.confirmMotDePasse ? 'pd-input-error' : ''} placeholder="Répétez le mot de passe" maxLength={100} />
                    {errors.confirmMotDePasse && <span className="pd-error-msg">{errors.confirmMotDePasse}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="pd-form-actions">
              <button type="button" className="pd-btn pd-btn-cancel" onClick={cancelEditing}>Annuler</button>
              <button type="submit" className="pd-btn pd-btn-save" style={{ background: roleGradient }} disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : '✓ Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}


