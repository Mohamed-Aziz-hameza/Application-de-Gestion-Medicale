// Page de profil utilisateur - Connectée au backend

import { useState, useCallback, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile, isAuthenticated, logout } from '../services/api';
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
        logout();
        navigate('/patient-login');
      } finally {
        setIsLoading(false);
      }
    })();
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
    clearNotification, togglePasswordChange,
  };
}

// ─── Icônes SVG ─────────────────────────────────────────────────
const CheckIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MedicalIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const EditIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PatientImage = () => (
  <svg viewBox="0 0 120 120" fill="none" className="profile-type-image">
    <circle cx="60" cy="60" r="58" fill="#dbeafe" stroke="#3b82f6" strokeWidth="4"/>
    <circle cx="60" cy="45" r="20" fill="#3b82f6"/>
    <path d="M30 95c0-16.569 13.431-30 30-30s30 13.431 30 30" fill="#3b82f6"/>
    <circle cx="60" cy="45" r="15" fill="#fff"/>
    <circle cx="55" cy="42" r="2" fill="#1e40af"/>
    <circle cx="65" cy="42" r="2" fill="#1e40af"/>
    <path d="M55 50c2.5 3 7.5 3 10 0" stroke="#1e40af" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MedecinImage = () => (
  <svg viewBox="0 0 120 120" fill="none" className="profile-type-image">
    <circle cx="60" cy="60" r="58" fill="#d1fae5" stroke="#10b981" strokeWidth="4"/>
    <circle cx="60" cy="45" r="20" fill="#10b981"/>
    <path d="M30 95c0-16.569 13.431-30 30-30s30 13.431 30 30" fill="#10b981"/>
    <circle cx="60" cy="45" r="15" fill="#fff"/>
    <circle cx="55" cy="42" r="2" fill="#065f46"/>
    <circle cx="65" cy="42" r="2" fill="#065f46"/>
    <path d="M55 50c2.5 3 7.5 3 10 0" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="85" cy="75" r="8" stroke="#065f46" strokeWidth="3" fill="none"/>
    <path d="M85 67V55c0-5-10-5-10-5" stroke="#065f46" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const LockIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// ─── Composant principal ────────────────────────────────────────
export default function ProfilePage() {
  const {
    utilisateur, formData, errors, isLoading, isSaving,
    isEditing, wantsPasswordChange, notification,
    handleChange, handleSubmit, startEditing, cancelEditing,
    clearNotification, togglePasswordChange,
  } = useProfile();

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!utilisateur) {
    return (
      <div className="profile-page">
        <div className="no-profile">
          <UserIcon />
          <h2>Aucun profil</h2>
          <p>Le profil sera chargé depuis une autre page.</p>
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Patient: 'Patient',
      Medecin: 'Médecin',
      Administrateur: 'Administrateur',
    };
    return labels[type] || type;
  };

  const isMedecin = formData.typeUtilisateur === 'Medecin';
  const sectionTitle = isMedecin ? 'Médecin' : 'Patient';

  return (
    <div className="profile-page">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`} onClick={clearNotification}>
          {notification.type === 'success' ? <CheckIcon /> : '⚠️'}
          {notification.message}
        </div>
      )}

      {/* En-tête du profil */}
      <div className="profile-header">
        <div className="profile-avatar">
          {isMedecin ? <MedecinImage /> : <PatientImage />}
        </div>
        <div className="profile-info">
          <h1>{sectionTitle}</h1>
        </div>
        {!isEditing && (
          <button type="button" className="btn btn-edit" onClick={startEditing}>
            <EditIcon /> Modifier
          </button>
        )}
      </div>

      {/* Mode visualisation */}
      {!isEditing && (
        <div className="profile-details">
          <div className="details-section">
            <h2><UserIcon /> Informations personnelles</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Prénom</span>
                <span className="detail-value">{formData.prenom}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nom</span>
                <span className="detail-value">{formData.nom}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{formData.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type de compte</span>
                <span className="detail-value">{getTypeLabel(formData.typeUtilisateur)}</span>
              </div>
            </div>
          </div>

          {formData.typeUtilisateur === 'Patient' && (
            <div className="details-section">
              <h2><MedicalIcon /> Informations Patient</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Date de naissance</span>
                  <span className="detail-value">{formData.dateNaissance || 'Non renseignée'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Téléphone</span>
                  <span className="detail-value">{formData.telephone || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
          )}

          {formData.typeUtilisateur === 'Medecin' && (
            <div className="details-section">
              <h2><MedicalIcon /> Informations Médecin</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Spécialité</span>
                  <span className="detail-value">{formData.specialite || 'Non renseignée'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode édition */}
      {isEditing && (
        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Informations personnelles */}
          <div className="form-section">
            <h2><UserIcon /> Informations personnelles</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="prenom">Prénom <span className="required">*</span></label>
                <input type="text" id="prenom" name="prenom" value={formData.prenom} onChange={handleChange}
                  className={errors.prenom ? 'error' : ''} placeholder="Votre prénom" maxLength={100} />
                {errors.prenom && <span className="error-message">{errors.prenom}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="nom">Nom <span className="required">*</span></label>
                <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange}
                  className={errors.nom ? 'error' : ''} placeholder="Votre nom" maxLength={100} />
                {errors.nom && <span className="error-message">{errors.nom}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                  className={errors.email ? 'error' : ''} placeholder="votre@email.com" maxLength={100} />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="typeUtilisateur">Type de compte</label>
                <input type="text" id="typeUtilisateur" value={getTypeLabel(formData.typeUtilisateur)} disabled />
              </div>
            </div>
          </div>

          {/* Section Patient */}
          {formData.typeUtilisateur === 'Patient' && (
            <div className="form-section">
              <h2><MedicalIcon /> Informations Patient</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="dateNaissance">Date de naissance</label>
                  <input type="date" id="dateNaissance" name="dateNaissance" value={formData.dateNaissance}
                    onChange={handleChange} className={errors.dateNaissance ? 'error' : ''} />
                  {errors.dateNaissance && <span className="error-message">{errors.dateNaissance}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="telephone">Téléphone</label>
                  <input type="tel" id="telephone" name="telephone" value={formData.telephone}
                    onChange={handleChange} className={errors.telephone ? 'error' : ''} placeholder="06 12 34 56 78" maxLength={20} />
                  {errors.telephone && <span className="error-message">{errors.telephone}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Section Médecin */}
          {formData.typeUtilisateur === 'Medecin' && (
            <div className="form-section">
              <h2><MedicalIcon /> Informations Médecin</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="specialite">Spécialité</label>
                  <input type="text" id="specialite" name="specialite" value={formData.specialite}
                    onChange={handleChange} className={errors.specialite ? 'error' : ''} placeholder="Cardiologie, Pédiatrie, Dermatologie..." maxLength={100} />
                  {errors.specialite && <span className="error-message">{errors.specialite}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Section Mot de passe */}
          <div className="form-section password-section">
            <div className="password-toggle">
              <h2><LockIcon /> Sécurité</h2>
              <label className="toggle-label">
                <input type="checkbox" checked={wantsPasswordChange} onChange={togglePasswordChange} />
                <span>Voulez-vous changer le mot de passe ?</span>
              </label>
            </div>

            {wantsPasswordChange && (
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="motDePasse">Nouveau mot de passe <span className="required">*</span></label>
                  <input type="password" id="motDePasse" name="motDePasse" value={formData.motDePasse}
                    onChange={handleChange} className={errors.motDePasse ? 'error' : ''} placeholder="Minimum 6 caractères" maxLength={100} />
                  {errors.motDePasse && <span className="error-message">{errors.motDePasse}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="confirmMotDePasse">Confirmer le mot de passe <span className="required">*</span></label>
                  <input type="password" id="confirmMotDePasse" name="confirmMotDePasse" value={formData.confirmMotDePasse}
                    onChange={handleChange} className={errors.confirmMotDePasse ? 'error' : ''} placeholder="Répétez le mot de passe" maxLength={100} />
                  {errors.confirmMotDePasse && <span className="error-message">{errors.confirmMotDePasse}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={cancelEditing}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Modifier'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};


