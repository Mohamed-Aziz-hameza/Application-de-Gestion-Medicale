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
