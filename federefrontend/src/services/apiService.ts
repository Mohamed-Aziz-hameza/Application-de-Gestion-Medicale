// Service API pour communiquer avec le backend Spring Boot

const API_BASE_URL = 'http://localhost:8081/api';

export interface UtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  typeUtilisateur: 'Patient' | 'Medecin' | 'Administrateur';
  dateNaissance?: string;
  telephone?: string;
  specialite?: string;
}

export interface UtilisateurResponse {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  typeUtilisateur: 'Patient' | 'Medecin' | 'Administrateur';
  statusCompte: string;
  dateNaissance?: string;
  telephone?: string;
  specialite?: string;
}

class ApiService {
  
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Une erreur est survenue' }));
      throw new Error(error.error || 'Une erreur est survenue');
    }
    
    return response.json();
  }
  
  // Créer un nouvel utilisateur
  async creerUtilisateur(data: UtilisateurRequest): Promise<UtilisateurResponse> {
    return this.request<UtilisateurResponse>('/utilisateurs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  // Récupérer tous les utilisateurs
  async getAllUtilisateurs(): Promise<UtilisateurResponse[]> {
    return this.request<UtilisateurResponse[]>('/utilisateurs');
  }
  
  // Récupérer un utilisateur par ID
  async getUtilisateurById(id: number): Promise<UtilisateurResponse> {
    return this.request<UtilisateurResponse>(`/utilisateurs/${id}`);
  }
  
  // Récupérer un utilisateur par email
  async getUtilisateurByEmail(email: string): Promise<UtilisateurResponse> {
    return this.request<UtilisateurResponse>(`/utilisateurs/email/${encodeURIComponent(email)}`);
  }
  
  // Mettre à jour un utilisateur
  async updateUtilisateur(id: number, data: UtilisateurRequest): Promise<UtilisateurResponse> {
    return this.request<UtilisateurResponse>(`/utilisateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  // Supprimer un utilisateur
  async deleteUtilisateur(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/utilisateurs/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
