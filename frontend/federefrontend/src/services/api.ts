// ─── API Service for communicating with Spring Boot backend (port 7070) ─────

const API_BASE = 'http://localhost:7070/api';

// Token expiration duration (24 hours in milliseconds) - must match backend
const TOKEN_EXPIRATION_MS = 86400000;

// ─── Types matching backend DTOs ────────────────────────────────

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoginPatientRequest {
  email: string;
  motDePasse: string;
}

export interface LoginMedecinAdminRequest {
  nom: string;
  prenom: string;
  id: number;
  motDePasse: string;
}

export interface OtpValidationRequest {
  email: string;
  codeOtp: string;
}

export interface RegisterPatientRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  dateNaissance?: string;
  telephone?: string;
}

export interface RegisterMedecinRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  specialite?: string;
}

export interface ProfileUpdateRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  dateNaissance?: string;
  telephone?: string;
  specialite?: string;
}

export interface UtilisateurResponseDTO {
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

export interface AdminUtilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  typeUtilisateur: 'Patient' | 'Medecin' | 'Administrateur';
  statusCompte?: string;
  dateNaissance?: string;
  telephone?: string;
  specialite?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ─── Consultation types ─────────────────────────────────────────

export interface ConsultationDTO {
  id: number;
  date: string;
  type: string;
  notes: string;
  statut: string;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  medecinId: number;
  medecinNom: string;
  medecinPrenom: string;
  medecinSpecialite: string;
}

export interface CreateConsultationRequest {
  patientId: number;
  date?: string;
  type?: string;
  notes?: string;
}

// ─── Dossier Médical types ──────────────────────────────────────

export interface DossierMedicalDTO {
  id: string;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  diagnostics: string[];
  prescriptions: string[];
  notesMedecin: string;
  antecedents?: string[];
  analyses?: string[];
  resultats?: string[];
  imageUrls?: string[];
  images?: DossierMedicalImageDTO[];
}

export interface DossierMedicalImageDTO {
  id: string;
  fileName: string;
  contentType: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface CreateDossierMedicalRequest {
  patientId: number;
  diagnostics?: string[];
  prescriptions?: string[];
  notesMedecin?: string;
  antecedents?: string[];
  analyses?: string[];
  resultats?: string[];
  imageUrls?: string[];
}

// ─── Rendez-vous types ──────────────────────────────────────────

export interface RendezVousDTO {
  id: number;
  dateRdv: string;
  heureRdv: string;
  motif: string;
  statut: string;
  disponibiliteId?: number;
  dateModificationMedecin?: string;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  medecinId: number;
  medecinNom: string;
  medecinPrenom: string;
  medecinSpecialite: string;
}

export interface CreateRendezVousRequest {
  medecinId: number;
  disponibiliteId?: number;
  dateRdv?: string;
  heureRdv?: string;
  motif?: string;
}

export interface RescheduleRendezVousRequest {
  disponibiliteId: number;
}

export interface DisponibiliteDTO {
  id: number;
  medecinId: number;
  medecinNom: string;
  medecinPrenom: string;
  medecinSpecialite?: string;
  dateDisponibilite: string;
  heureDebut: string;
  heureFin: string;
  statut: 'DISPONIBLE' | 'RESERVE' | 'INDISPONIBLE';
}

export interface CreateDisponibiliteRequest {
  dateDisponibilite: string;
  heureDebut: string;
  heureFin: string;
}

export interface GenerateDisponibilitesRequest {
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  dureeMinutes: number;
  joursSemaine?: number[];
}

export interface NotificationDTO {
  id: number;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  createdAt: string;
}

export interface AnalyseTimelineEventDTO {
  id: number;
  eventType: string;
  description: string;
  actorRole: string;
  createdBy?: string;
  createdAt: string;
}

export interface AnalyseResultatDTO {
  id: number;
  typeAnalyse: string;
  motifClinique?: string;
  laboratoire?: string;
  priorite: string;
  statut: string;
  progression: number;
  resultatValeur?: string;
  unite?: string;
  intervalleReference?: string;
  interpretation?: string;
  conclusion?: string;
  dateDemande: string;
  dateResultat?: string;
  dateMiseAJour: string;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  medecinId: number;
  medecinNom: string;
  medecinPrenom: string;
  rendezVousId?: number;
  createdWithAi: boolean;
  approvedByDoctor: boolean;
  creationType: 'HUMAN_MADE' | 'AI_MADE' | 'AI_MADE_APPROVED_BY_DOCTOR';
  creationTypeLabel: string;
  timeline: AnalyseTimelineEventDTO[];
}

export interface CreateAnalyseResultatRequest {
  patientId: number;
  rendezVousId?: number;
  typeAnalyse: string;
  motifClinique?: string;
  laboratoire?: string;
  priorite?: string;
}

export interface CreateAnalyseAvecAiRequest {
  patientId: number;
  dossierMedicalId?: string;
  rendezVousId?: number;
  typeAnalyse: string;
  motifClinique?: string;
  laboratoire?: string;
  priorite?: string;
  instructions?: string;
}

export interface UpdateAnalyseResultatRequest {
  statut?: string;
  progression?: number;
  resultatValeur?: string;
  unite?: string;
  intervalleReference?: string;
  interpretation?: string;
  conclusion?: string;
  commentaireTimeline?: string;
}

export interface AddAnalyseTimelineEventRequest {
  eventType?: string;
  description: string;
}

// ─── Token & Session management ─────────────────────────────────

export function getToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  // Check if token has expired based on stored login time
  const loginTime = localStorage.getItem('tokenLoginTime');
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime, 10);
    if (elapsed >= TOKEN_EXPIRATION_MS) {
      // Token expired - clean up
      clearSession();
      return null;
    }
  }
  return token;
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
  localStorage.setItem('tokenLoginTime', String(Date.now()));
}

export function removeToken(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenLoginTime');
}

export function getUser(): AuthResponse | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: AuthResponse): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem('user');
}

function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenLoginTime');
  localStorage.removeItem('user');
}

/**
 * Logout: call backend to blacklist token, then clear local session.
 */
export async function logout(): Promise<void> {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // Even if the API call fails, we still clear the local session
    }
  }
  clearSession();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Get remaining session time in milliseconds.
 * Returns 0 if session is expired or no token exists.
 */
export function getSessionTimeRemaining(): number {
  const loginTime = localStorage.getItem('tokenLoginTime');
  if (!loginTime) return 0;
  const remaining = TOKEN_EXPIRATION_MS - (Date.now() - parseInt(loginTime, 10));
  return remaining > 0 ? remaining : 0;
}

/**
 * Start a session expiry watcher that calls the callback when the token expires.
 * Returns a cleanup function to stop the watcher.
 */
export function watchSessionExpiry(onExpired: () => void): () => void {
  const intervalId = setInterval(() => {
    if (!isAuthenticated()) {
      clearInterval(intervalId);
      onExpired();
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(intervalId);
}

// ─── HTTP helpers ───────────────────────────────────────────────

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Erreur ${response.status}`);
  }

  return response.json();
}

async function requestFormData<T>(url: string, method: 'POST' | 'PUT', data: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// ─── Auth endpoints ─────────────────────────────────────────────

/** Patient login step 1: email + password → sends OTP to email */
export function loginPatient(data: LoginPatientRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/login/patient', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Patient login step 2: verify OTP → returns JWT */
export function verifyPatientOtp(data: OtpValidationRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/patient/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin / Admin login: nom + prenom + id + password → returns JWT */
export function loginMedecinAdmin(data: LoginMedecinAdminRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Register a patient */
export function registerPatient(data: RegisterPatientRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/register/patient', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Register a medecin */
export function registerMedecin(data: RegisterMedecinRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/register/medecin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Profile endpoints (requires JWT) ───────────────────────────

/** Get the current authenticated user's profile */
export function getMyProfile(): Promise<UtilisateurResponseDTO> {
  return request<UtilisateurResponseDTO>('/profile');
}

/** Update the current authenticated user's profile */
export function updateMyProfile(data: ProfileUpdateRequest): Promise<UtilisateurResponseDTO> {
  return request<UtilisateurResponseDTO>('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Admin endpoints (requires JWT + ROLE_ADMIN) ────────────────

/** Get all users */
export function adminGetAllUsers(): Promise<AdminUtilisateur[]> {
  return request<AdminUtilisateur[]>('/admin/utilisateurs');
}

/** Get a user by ID */
export function adminGetUserById(id: number): Promise<AdminUtilisateur> {
  return request<AdminUtilisateur>(`/admin/utilisateurs/${id}`);
}

/** Activate a user account */
export function adminActivateUser(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`/admin/activate/${id}`, { method: 'PUT' });
}

/** Deactivate a user account */
export function adminDeactivateUser(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`/admin/deactivate/${id}`, { method: 'PUT' });
}

/** Admin gets all rendez-vous */
export function adminGetAllRendezVous(): Promise<RendezVousDTO[]> {
  return request<RendezVousDTO[]>('/admin/rendez-vous');
}

/** Admin gets all disponibilites */
export function adminGetAllDisponibilites(): Promise<DisponibiliteDTO[]> {
  return request<DisponibiliteDTO[]>('/admin/disponibilites');
}

/** Admin gets all dossiers */
export function adminGetAllDossiers(): Promise<DossierMedicalDTO[]> {
  return request<DossierMedicalDTO[]>('/admin/dossiers');
}

/** Admin gets all notifications */
export function adminGetAllNotifications(): Promise<NotificationDTO[]> {
  return request<NotificationDTO[]>('/admin/notifications');
}

// ─── Forgot / Reset Password endpoints ──────────────────────────

/** Request a password reset link (sends email) */
export function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Reset password using token */
export function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Validate a reset token (check if still valid) */
export function validateResetToken(token: string): Promise<MessageResponse> {
  return request<MessageResponse>(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
}

// ─── Consultation endpoints ─────────────────────────────────────

/** Medecin creates a consultation */
export function createConsultation(data: CreateConsultationRequest): Promise<ConsultationDTO> {
  return request<ConsultationDTO>('/consultations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin gets their consultations */
export function getMedecinConsultations(): Promise<ConsultationDTO[]> {
  return request<ConsultationDTO[]>('/consultations/medecin');
}

/** Patient gets their consultations */
export function getPatientConsultations(): Promise<ConsultationDTO[]> {
  return request<ConsultationDTO[]>('/consultations/patient');
}

/** Get consultation by ID */
export function getConsultationById(id: number): Promise<ConsultationDTO> {
  return request<ConsultationDTO>(`/consultations/${id}`);
}

/** Medecin updates a consultation */
export function updateConsultation(id: number, data: CreateConsultationRequest): Promise<ConsultationDTO> {
  return request<ConsultationDTO>(`/consultations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Medecin deletes a consultation */
export function deleteConsultation(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`/consultations/${id}`, { method: 'DELETE' });
}

/** Patient searches consultations by type */
export function searchConsultations(type: string): Promise<ConsultationDTO[]> {
  return request<ConsultationDTO[]>(`/consultations/patient/search?type=${encodeURIComponent(type)}`);
}

// ─── Dossier Médical endpoints ──────────────────────────────────

/** Medecin creates a dossier medical */
export function createDossierMedical(data: CreateDossierMedicalRequest): Promise<DossierMedicalDTO> {
  return request<DossierMedicalDTO>('/dossier-medical', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin gets dossier for a specific patient */
export function getDossierByPatient(patientId: number): Promise<DossierMedicalDTO> {
  return request<DossierMedicalDTO>(`/dossier-medical/patient/${patientId}`);
}

/** Patient gets their own dossier */
export function getMyDossierMedical(): Promise<DossierMedicalDTO> {
  return request<DossierMedicalDTO>('/dossier-medical/me');
}

/** Medecin updates a dossier medical */
export function updateDossierMedical(id: string, data: CreateDossierMedicalRequest): Promise<DossierMedicalDTO> {
  return request<DossierMedicalDTO>(`/dossier-medical/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Medecin uploads medical image files into MongoDB dossier */
export function uploadDossierImages(id: string, files: File[]): Promise<DossierMedicalDTO> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return requestFormData<DossierMedicalDTO>(`/dossier-medical/${id}/images`, 'POST', formData);
}

/** Medecin removes one uploaded image */
export function deleteDossierImage(id: string, imageId: string): Promise<DossierMedicalDTO> {
  return request<DossierMedicalDTO>(`/dossier-medical/${id}/images/${encodeURIComponent(imageId)}`, { method: 'DELETE' });
}

/** Medecin deletes a dossier medical */
export function deleteDossierMedical(id: string): Promise<MessageResponse> {
  return request<MessageResponse>(`/dossier-medical/${id}`, { method: 'DELETE' });
}

/** Medecin gets all dossier medical records */
export function getAllDossiersMedical(): Promise<DossierMedicalDTO[]> {
  return request<DossierMedicalDTO[]>('/dossier-medical/all');
}

// ─── Rendez-vous endpoints ──────────────────────────────────────

/** Patient creates a rendez-vous */
export function createRendezVous(data: CreateRendezVousRequest): Promise<RendezVousDTO> {
  return request<RendezVousDTO>('/rendez-vous', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Patient gets their rendez-vous */
export function getPatientRendezVous(): Promise<RendezVousDTO[]> {
  return request<RendezVousDTO[]>('/rendez-vous/patient');
}

/** Medecin gets their rendez-vous */
export function getMedecinRendezVous(): Promise<RendezVousDTO[]> {
  return request<RendezVousDTO[]>('/rendez-vous/medecin');
}

/** Medecin gets pending rendez-vous (notifications) */
export function getMedecinPendingRendezVous(): Promise<RendezVousDTO[]> {
  return request<RendezVousDTO[]>('/rendez-vous/medecin/pending');
}

/** Medecin confirms/rejects a rendez-vous */
export function updateRendezVousStatut(id: number, statut: string): Promise<RendezVousDTO> {
  return request<RendezVousDTO>(`/rendez-vous/${id}/statut?statut=${encodeURIComponent(statut)}`, {
    method: 'PUT',
  });
}

/** Medecin reschedules an existing rendez-vous to a new slot */
export function rescheduleRendezVous(id: number, data: RescheduleRendezVousRequest): Promise<RendezVousDTO> {
  return request<RendezVousDTO>(`/rendez-vous/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Patient cancels a rendez-vous */
export function cancelRendezVous(id: number): Promise<RendezVousDTO> {
  return request<RendezVousDTO>(`/rendez-vous/${id}/cancel`, { method: 'PUT' });
}

/** Medecin deletes a rendez-vous */
export function deleteRendezVous(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`/rendez-vous/${id}`, { method: 'DELETE' });
}

// ─── Medecin disponibilite endpoints ───────────────────────────

/** Medecin creates a single slot */
export function createDisponibilite(data: CreateDisponibiliteRequest): Promise<DisponibiliteDTO> {
  return request<DisponibiliteDTO>('/disponibilites', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin bulk-generates slots */
export function generateDisponibilites(data: GenerateDisponibilitesRequest): Promise<DisponibiliteDTO[]> {
  return request<DisponibiliteDTO[]>('/disponibilites/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin gets own slots */
export function getMyDisponibilites(): Promise<DisponibiliteDTO[]> {
  return request<DisponibiliteDTO[]>('/disponibilites/medecin');
}

/** Patient gets available slots for a medecin on a date */
export function getAvailableSlotsForMedecinDate(medecinId: number, date: string): Promise<DisponibiliteDTO[]> {
  return request<DisponibiliteDTO[]>(`/disponibilites/public/medecin/${medecinId}?date=${encodeURIComponent(date)}`);
}

/** Medecin marks a slot unavailable */
export function markSlotIndisponible(slotId: number): Promise<DisponibiliteDTO> {
  return request<DisponibiliteDTO>(`/disponibilites/${slotId}/indisponible`, { method: 'PUT' });
}

/** Medecin deletes a non-reserved slot */
export function deleteDisponibilite(slotId: number): Promise<MessageResponse> {
  return request<MessageResponse>(`/disponibilites/${slotId}`, { method: 'DELETE' });
}

// ─── Notification endpoints ─────────────────────────────────────

/** Current user gets notifications */
export function getMyNotifications(): Promise<NotificationDTO[]> {
  return request<NotificationDTO[]>('/notifications/me');
}

/** Current user gets unread notification count */
export function getMyUnreadNotificationCount(): Promise<{ unread: number }> {
  return request<{ unread: number }>('/notifications/me/unread-count');
}

/** Mark all current user notifications as read */
export function markAllNotificationsAsRead(): Promise<{ updated: number }> {
  return request<{ updated: number }>('/notifications/me/read-all', { method: 'PUT' });
}

/** Mark notification as read */
export function markNotificationAsRead(id: number): Promise<NotificationDTO> {
  return request<NotificationDTO>(`/notifications/${id}/read`, { method: 'PUT' });
}

// ─── Analyses / Resultats endpoints ────────────────────────────

/** Medecin creates an analyse request */
export function createAnalyseResultat(data: CreateAnalyseResultatRequest): Promise<AnalyseResultatDTO> {
  return request<AnalyseResultatDTO>('/analyses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin creates an AI-generated analysis based on dossier context */
export function createAnalyseResultatWithAi(data: CreateAnalyseAvecAiRequest): Promise<AnalyseResultatDTO> {
  return request<AnalyseResultatDTO>('/analyses/ai', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin updates analyse progression or result */
export function updateAnalyseResultat(id: number, data: UpdateAnalyseResultatRequest): Promise<AnalyseResultatDTO> {
  return request<AnalyseResultatDTO>(`/analyses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Medecin approves an AI-generated analysis */
export function approveAnalyseAiByDoctor(id: number): Promise<AnalyseResultatDTO> {
  return request<AnalyseResultatDTO>(`/analyses/${id}/approve-ai`, {
    method: 'PUT',
  });
}

/** Medecin appends a timeline event */
export function addAnalyseTimelineEvent(id: number, data: AddAnalyseTimelineEventRequest): Promise<AnalyseTimelineEventDTO> {
  return request<AnalyseTimelineEventDTO>(`/analyses/${id}/timeline`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin gets own analyses */
export function getMedecinAnalyses(): Promise<AnalyseResultatDTO[]> {
  return request<AnalyseResultatDTO[]>('/analyses/medecin/me');
}

/** Patient gets own analyses */
export function getPatientAnalyses(): Promise<AnalyseResultatDTO[]> {
  return request<AnalyseResultatDTO[]>('/analyses/patient/me');
}

/** Get one analyse detail with timeline */
export function getAnalyseById(id: number): Promise<AnalyseResultatDTO> {
  return request<AnalyseResultatDTO>(`/analyses/${id}`);
}

/** Admin gets all analyses */
export function adminGetAllAnalyses(): Promise<AnalyseResultatDTO[]> {
  return request<AnalyseResultatDTO[]>('/admin/analyses');
}

// ─── Patient/Medecin listing endpoints ──────────────────────────

/** Medecin gets all patients */
export function getAllPatients(): Promise<UtilisateurResponseDTO[]> {
  return request<UtilisateurResponseDTO[]>('/patients');
}

/** Medecin creates a patient */
export function createPatientByMedecin(data: RegisterPatientRequest): Promise<UtilisateurResponseDTO> {
  return request<UtilisateurResponseDTO>('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Medecin updates a patient */
export function updatePatientByMedecin(id: number, data: RegisterPatientRequest): Promise<UtilisateurResponseDTO> {
  return request<UtilisateurResponseDTO>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Medecin deletes a patient */
export function deletePatientByMedecin(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`/patients/${id}`, { method: 'DELETE' });
}

/** Admin deletes a patient */
export function adminDeletePatient(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`/patients/${id}`, { method: 'DELETE' });
}

/** Patient gets all medecins */
export function getAllMedecins(): Promise<UtilisateurResponseDTO[]> {
  return request<UtilisateurResponseDTO[]>('/patients/medecins');
}
