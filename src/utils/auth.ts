import { AdminUser } from '../types';

const STORAGE_ADMIN_SESSION_KEY = 'kajian_anak_admin_session_v1';
const STORAGE_ADMIN_PASSWORD_KEY = 'kajian_anak_admin_password_v1';
const STORAGE_ADMIN_USERNAME_KEY = 'kajian_anak_admin_username_v1';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

/**
 * Get current stored credentials
 */
export function getStoredAdminCredentials(): { username: string; passwordHash: string } {
  try {
    const username = localStorage.getItem(STORAGE_ADMIN_USERNAME_KEY) || DEFAULT_USERNAME;
    const passwordHash = localStorage.getItem(STORAGE_ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;
    return { username, passwordHash };
  } catch {
    return { username: DEFAULT_USERNAME, passwordHash: DEFAULT_PASSWORD };
  }
}

/**
 * Get currently authenticated admin user
 */
export function getAdminSession(): AdminUser | null {
  try {
    const data = localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Login admin with username and password
 */
export function loginAdmin(usernameInput: string, passwordInput: string): { success: boolean; message: string; user?: AdminUser } {
  const { username, passwordHash } = getStoredAdminCredentials();
  
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanStoredUsername = username.trim().toLowerCase();

  // Accept username or 'panitia@kajian.id' as alias
  const isUsernameMatch = cleanUsername === cleanStoredUsername || cleanUsername === 'panitia@kajian.id';
  const isPasswordMatch = passwordInput === passwordHash;

  if (isUsernameMatch && isPasswordMatch) {
    const user: AdminUser = {
      username: cleanStoredUsername,
      name: 'Panitia Kajian Utama',
      role: 'admin',
      lastLogin: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save admin session:', err);
    }
    return { success: true, message: 'Login berhasil', user };
  }

  return { success: false, message: 'Username atau password admin salah. Silakan coba lagi.' };
}

/**
 * Logout admin
 */
export function logoutAdmin(): void {
  try {
    localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  } catch (err) {
    console.error('Failed to clear admin session:', err);
  }
}

/**
 * Update admin password
 */
export function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): { success: boolean; message: string } {
  const { passwordHash } = getStoredAdminCredentials();

  if (currentPassword !== passwordHash) {
    return { success: false, message: 'Password saat ini tidak sesuai.' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'Password baru minimal harus 6 karakter.' };
  }

  try {
    localStorage.setItem(STORAGE_ADMIN_PASSWORD_KEY, newPassword);
    return { success: true, message: 'Password admin berhasil diperbarui!' };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan password baru ke penyimpanan lokal.' };
  }
}

/**
 * Reset admin credentials to default (admin / admin123)
 */
export function resetAdminCredentials(): void {
  try {
    localStorage.setItem(STORAGE_ADMIN_USERNAME_KEY, DEFAULT_USERNAME);
    localStorage.setItem(STORAGE_ADMIN_PASSWORD_KEY, DEFAULT_PASSWORD);
  } catch (err) {
    console.error('Failed to reset admin credentials:', err);
  }
}
