// Hook simplifié pour la modification du profil utilisateur
// Communique avec le backend Spring Boot

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useCallback, useEffect } from 'react';
import type { 
  ProfileFormData, 
  ValidationErrors,
  UtilisateurComplet
} from '../types/database.types';
import { validateProfileFormEdit, hasErrors } from '../utils/validationDB';
import { apiService, type UtilisateurResponse } from '../services/apiService';

interface UseProfileDBReturn {
  utilisateur: UtilisateurComplet | null;
  allUsers: UtilisateurResponse[];
  formData: ProfileFormData;
  errors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  wantsPasswordChange: boolean;
  notification: { type: 'success' | 'error'; message: string } | null;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  startEditing: () => void;
  cancelEditing: () => void;
  clearNotification: () => void;
  selectUser: (userId: number) => void;
  togglePasswordChange: () => void;
}

const initialFormData: ProfileFormData = {
  nom: '',
  prenom: '',
  email: '',
  motDePasse: '',
  confirmMotDePasse: '',
  typeUtilisateur: 'Patient',
  dateNaissance: '',
  telephone: '',
  specialite: '',
};

export function useProfileDB(): UseProfileDBReturn {
  const [utilisateur, setUtilisateur] = useState<UtilisateurComplet | null>(null);
  const [allUsers, setAllUsers] = useState<UtilisateurResponse[]>([]);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [wantsPasswordChange, setWantsPasswordChange] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Convertir la réponse API en UtilisateurComplet
  const mapResponseToUtilisateur = (response: UtilisateurResponse): UtilisateurComplet => {
    const base = {
      id: response.id,
      nom: response.nom,
      prenom: response.prenom,
      email: response.email,
      statusCompte_id: 1,
      typeUtilisateur: response.typeUtilisateur,
    };
    
    switch (response.typeUtilisateur) {
      case 'Patient':
        return {
          ...base,
          typeUtilisateur: 'Patient',
          dateNaissance: response.dateNaissance || null,
          telephone: response.telephone || null,
        };
      case 'Medecin':
        return {
          ...base,
          typeUtilisateur: 'Medecin',
          specialite: response.specialite || null,
        };
      case 'Administrateur':
        return {
          ...base,
          typeUtilisateur: 'Administrateur',
        };
    }
  };

  // Peupler le formulaire à partir de l'utilisateur
  const populateFormFromUser = (user: UtilisateurComplet) => {
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      motDePasse: '',
      confirmMotDePasse: '',
      typeUtilisateur: user.typeUtilisateur,
      dateNaissance: user.typeUtilisateur === 'Patient' ? (user as any).dateNaissance || '' : '',
      telephone: user.typeUtilisateur === 'Patient' ? (user as any).telephone || '' : '',
      specialite: user.typeUtilisateur === 'Medecin' ? (user as any).specialite || '' : '',
    });
    setWantsPasswordChange(false);
  };

  // Charger tous les utilisateurs au démarrage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Charger tous les utilisateurs
        const users = await apiService.getAllUtilisateurs();
        setAllUsers(users || []);
        
        const savedUserId = localStorage.getItem('utilisateur_id');
        
        if (savedUserId) {
          // Charger par ID sauvegardé
          const user = await apiService.getUtilisateurById(parseInt(savedUserId));
          const utilisateurComplet = mapResponseToUtilisateur(user);
          setUtilisateur(utilisateurComplet);
          populateFormFromUser(utilisateurComplet);
        } else if (users && users.length > 0) {
          // Charger le premier utilisateur de la base de données
          const firstUser = users[0];
          const utilisateurComplet = mapResponseToUtilisateur(firstUser);
          setUtilisateur(utilisateurComplet);
          populateFormFromUser(utilisateurComplet);
          localStorage.setItem('utilisateur_id', firstUser.id.toString());
        }
      } catch (e) {
        console.error('Erreur lors du chargement:', e);
        localStorage.removeItem('utilisateur_id');
      }
      setIsLoading(false);
    };
    
    loadProfile();
  }, []);

  // Sélectionner un utilisateur spécifique
  const selectUser = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      const user = await apiService.getUtilisateurById(userId);
      const utilisateurComplet = mapResponseToUtilisateur(user);
      setUtilisateur(utilisateurComplet);
      populateFormFromUser(utilisateurComplet);
      localStorage.setItem('utilisateur_id', userId.toString());
      setIsEditing(false);
    } catch (e) {
      console.error('Erreur lors du chargement de l\'utilisateur:', e);
      setNotification({
        type: 'error',
        message: 'Erreur lors du chargement de l\'utilisateur.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle pour le changement de mot de passe
  const togglePasswordChange = useCallback(() => {
    setWantsPasswordChange(prev => {
      if (!prev === false) {
        // Reset password fields when turning off
        setFormData(f => ({ ...f, motDePasse: '', confirmMotDePasse: '' }));
      }
      return !prev;
    });
  }, []);

  // Gérer les changements de formulaire
  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: ProfileFormData) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev: ValidationErrors) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Soumettre le formulaire - Mise à jour uniquement
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!utilisateur) {
      setNotification({
        type: 'error',
        message: 'Aucun utilisateur à modifier.',
      });
      return;
    }

    // Valider le formulaire
    const validationErrors = validateProfileFormEdit(formData, wantsPasswordChange);
    setErrors(validationErrors);
    
    if (hasErrors(validationErrors)) {
      setNotification({
        type: 'error',
        message: 'Veuillez corriger les erreurs du formulaire.',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Préparer les données pour l'API
      const requestData: {
        nom: string;
        prenom: string;
        email: string;
        motDePasse?: string;
        typeUtilisateur: 'Patient' | 'Medecin' | 'Administrateur';
        dateNaissance?: string;
        telephone?: string;
        specialite?: string;
      } = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        motDePasse: wantsPasswordChange && formData.motDePasse ? formData.motDePasse : undefined,
        typeUtilisateur: formData.typeUtilisateur as 'Patient' | 'Medecin' | 'Administrateur',
        dateNaissance: formData.typeUtilisateur === 'Patient' ? formData.dateNaissance : undefined,
        telephone: formData.typeUtilisateur === 'Patient' ? formData.telephone : undefined,
        specialite: formData.typeUtilisateur === 'Medecin' ? formData.specialite : undefined,
      };

      const response = await apiService.updateUtilisateur(utilisateur.id, requestData);
      const updatedUser = mapResponseToUtilisateur(response);
      
      setUtilisateur(updatedUser);
      setIsEditing(false);
      setWantsPasswordChange(false);
      setFormData(f => ({ ...f, motDePasse: '', confirmMotDePasse: '' }));
      
      // Recharger la liste des utilisateurs
      const users = await apiService.getAllUtilisateurs();
      setAllUsers(users || []);
      
      setNotification({
        type: 'success',
        message: wantsPasswordChange ? 'Profil et mot de passe mis à jour avec succès!' : 'Profil mis à jour avec succès!',
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Démarrer le mode édition
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setErrors({});
  }, []);

  // Annuler le mode édition
  const cancelEditing = useCallback(() => {
    if (utilisateur) {
      populateFormFromUser(utilisateur);
    }
    setIsEditing(false);
    setErrors({});
  }, [utilisateur]);

  // Effacer la notification
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Auto-effacer la notification après 5 secondes
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return {
    utilisateur,
    allUsers,
    formData,
    errors,
    isLoading,
    isSaving,
    isEditing,
    wantsPasswordChange,
    notification,
    handleChange,
    handleSubmit,
    startEditing,
    cancelEditing,
    clearNotification,
    selectUser,
    togglePasswordChange,
  };
}
