// Validation des données selon la structure de la base de données

import type { ProfileFormData, ValidationErrors } from '../types/database.types';

/**
 * Valide un email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Optionnel
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valide une date de naissance
 */
export const isValidDateNaissance = (dateStr: string): boolean => {
  if (!dateStr) return true; // Optionnel
  const date = new Date(dateStr);
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120);
  
  return date <= today && date >= minDate && !isNaN(date.getTime());
};

/**
 * Valide un mot de passe (min 6 caractères)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Valide que le champ n'est pas vide
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Valide la longueur minimale
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Valide la longueur maximale
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

/**
 * Valide le formulaire de profil selon la structure BD
 */
export const validateProfileForm = (formData: ProfileFormData, isNewUser: boolean = true): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validation nom (obligatoire, max 100)
  if (!isNotEmpty(formData.nom)) {
    errors.nom = 'Le nom est requis';
  } else if (!hasMaxLength(formData.nom, 100)) {
    errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
  }

  // Validation prénom (obligatoire, max 100)
  if (!isNotEmpty(formData.prenom)) {
    errors.prenom = 'Le prénom est requis';
  } else if (!hasMaxLength(formData.prenom, 100)) {
    errors.prenom = 'Le prénom ne peut pas dépasser 100 caractères';
  }

  // Validation email (obligatoire, unique, max 100)
  if (!isNotEmpty(formData.email)) {
    errors.email = 'L\'email est requis';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Format d\'email invalide';
  } else if (!hasMaxLength(formData.email, 100)) {
    errors.email = 'L\'email ne peut pas dépasser 100 caractères';
  }

  // Validation mot de passe (obligatoire pour nouveau, min 6)
  if (isNewUser) {
    if (!isNotEmpty(formData.motDePasse)) {
      errors.motDePasse = 'Le mot de passe est requis';
    } else if (!isValidPassword(formData.motDePasse)) {
      errors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Confirmation mot de passe
    if (formData.motDePasse !== formData.confirmMotDePasse) {
      errors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
    }
  } else if (formData.motDePasse && !isValidPassword(formData.motDePasse)) {
    errors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
  }

  // Validation selon le type d'utilisateur
  if (formData.typeUtilisateur === 'Patient') {
    // Téléphone optionnel mais si renseigné, doit être valide (max 20)
    if (formData.telephone && !isValidPhone(formData.telephone)) {
      errors.telephone = 'Format de téléphone invalide';
    }
    if (formData.telephone && !hasMaxLength(formData.telephone, 20)) {
      errors.telephone = 'Le téléphone ne peut pas dépasser 20 caractères';
    }

    // Date de naissance optionnelle mais si renseignée, doit être valide
    if (formData.dateNaissance && !isValidDateNaissance(formData.dateNaissance)) {
      errors.dateNaissance = 'Date de naissance invalide';
    }
  }

  if (formData.typeUtilisateur === 'Medecin') {
    // Spécialité optionnelle (max 100)
    if (formData.specialite && !hasMaxLength(formData.specialite, 100)) {
      errors.specialite = 'La spécialité ne peut pas dépasser 100 caractères';
    }
  }

  return errors;
};

/**
 * Valide le formulaire de profil pour modification (mot de passe optionnel)
 */
export const validateProfileFormEdit = (formData: ProfileFormData, validatePassword: boolean = false): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validation nom (obligatoire, max 100)
  if (!isNotEmpty(formData.nom)) {
    errors.nom = 'Le nom est requis';
  } else if (!hasMaxLength(formData.nom, 100)) {
    errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
  }

  // Validation prénom (obligatoire, max 100)
  if (!isNotEmpty(formData.prenom)) {
    errors.prenom = 'Le prénom est requis';
  } else if (!hasMaxLength(formData.prenom, 100)) {
    errors.prenom = 'Le prénom ne peut pas dépasser 100 caractères';
  }

  // Validation email (obligatoire, max 100)
  if (!isNotEmpty(formData.email)) {
    errors.email = 'L\'email est requis';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Format d\'email invalide';
  } else if (!hasMaxLength(formData.email, 100)) {
    errors.email = 'L\'email ne peut pas dépasser 100 caractères';
  }

  // Validation mot de passe (si demandé)
  if (validatePassword) {
    if (!isNotEmpty(formData.motDePasse)) {
      errors.motDePasse = 'Le mot de passe est requis';
    } else if (!isValidPassword(formData.motDePasse)) {
      errors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      errors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
    }
  }

  // Validation selon le type d'utilisateur
  if (formData.typeUtilisateur === 'Patient') {
    if (formData.telephone && !isValidPhone(formData.telephone)) {
      errors.telephone = 'Format de téléphone invalide';
    }
    if (formData.telephone && !hasMaxLength(formData.telephone, 20)) {
      errors.telephone = 'Le téléphone ne peut pas dépasser 20 caractères';
    }
    if (formData.dateNaissance && !isValidDateNaissance(formData.dateNaissance)) {
      errors.dateNaissance = 'Date de naissance invalide';
    }
  }

  if (formData.typeUtilisateur === 'Medecin') {
    if (formData.specialite && !hasMaxLength(formData.specialite, 100)) {
      errors.specialite = 'La spécialité ne peut pas dépasser 100 caractères';
    }
  }

  return errors;
};

/**
 * Vérifie si le formulaire a des erreurs
 */
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};
