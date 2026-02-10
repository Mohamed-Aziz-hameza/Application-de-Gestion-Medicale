// Types correspondant à la base de données app_medicale

// Types d'utilisateur selon la BD
export type TypeUtilisateur = 'Medecin' | 'Patient' | 'Administrateur';

// Status du compte
export interface StatusCompte {
  id: number;
  libelle: string;
}

// Table utilisateur
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string; // Ne pas exposer côté client
  statusCompte_id: number;
  statusCompte?: StatusCompte;
  typeUtilisateur: TypeUtilisateur;
}

// Table patient (extension de utilisateur)
export interface Patient extends Utilisateur {
  typeUtilisateur: 'Patient';
  dateNaissance: string | null;
  telephone: string | null;
}

// Table medecin (extension de utilisateur)
export interface Medecin extends Utilisateur {
  typeUtilisateur: 'Medecin';
  specialite: string | null;
}

// Table administrateur (extension de utilisateur)
export interface Administrateur extends Utilisateur {
  typeUtilisateur: 'Administrateur';
}

// Union type pour tous les utilisateurs
export type UtilisateurComplet = Patient | Medecin | Administrateur;

// Formulaire de profil adapté à la BD
export interface ProfileFormData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  confirmMotDePasse: string;
  typeUtilisateur: TypeUtilisateur;
  // Champs Patient
  dateNaissance: string;
  telephone: string;
  // Champs Medecin
  specialite: string;
}

// Requête de création/mise à jour utilisateur
export interface CreateUtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  typeUtilisateur: TypeUtilisateur;
  statusCompte_id?: number;
  // Patient
  dateNaissance?: string;
  telephone?: string;
  // Medecin
  specialite?: string;
}

export interface UpdateUtilisateurRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  // Patient
  dateNaissance?: string;
  telephone?: string;
  // Medecin
  specialite?: string;
}

// Erreurs de validation
export interface ValidationErrors {
  [key: string]: string;
}

// Réponse API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationErrors;
}

// Status de compte prédéfinis
export const STATUS_COMPTE = {
  ACTIF: 1,
  INACTIF: 2,
  EN_ATTENTE: 3,
  BLOQUE: 4,
} as const;
