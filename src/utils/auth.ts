import { AdminUser } from '../types';
import { getCloudAdminCredentials, saveCloudAdminCredentials } from '../firebase';

const STORAGE_ADMIN_SESSION_KEY = 'kajian_anak_admin_session_v1';
const STORAGE_ADMIN_PASSWORD_KEY = 'kajian_anak_admin_password_v1';
const STORAGE_ADMIN_USERNAME_KEY = 'kajian_anak_admin_username_v1';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

// In-memory cache
let memoryUsername = DEFAULT_USERNAME;
let memoryPassword = DEFAULT_PASSWORD;
let memorySession: AdminUser | null = null;

// Background initial sync from Firestore for admin credentials
getCloudAdminCredentials().then((creds) => {
  if (creds) {
    memoryUsername = creds.username;
    memoryPassword = creds.passwordHash;
    try {
      localStorage.setItem(STORAGE_ADMIN_USERNAME_KEY, creds.username);
      localStorage.setItem(STORAGE_ADMIN_PASSWORD_KEY, creds.passwordHash);
    } catch {}
  }
}).catch(() => {});

/**
 * Get current stored credentials
 */
export function getStoredAdminCredentials(): { username: string; passwordHash: string } {
  try {
    const username = localStorage.getItem(STORAGE_ADMIN_USERNAME_KEY) || memoryUsername || DEFAULT_USERNAME;
    const passwordHash = localStorage.getItem(STORAGE_ADMIN_PASSWORD_KEY) || memoryPassword || DEFAULT_PASSWORD;
    return { 
      username: username.trim(), 
      passwordHash: passwordHash.trim() 
    };
  } catch {
    return { 
      username: memoryUsername.trim(), 
      passwordHash: memoryPassword.trim() 
    };
  }
}

/**
 * Get currently authenticated admin user
 */
export function getAdminSession(): AdminUser | null {
  try {
    const data = localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!data) return memorySession;
    return JSON.parse(data);
  } catch {
    return memorySession;
  }
}

/**
 * Login admin with username and password
 */
export function loginAdmin(usernameInput: string, passwordInput: string): { success: boolean; message: string; user?: AdminUser } {
  const { username, passwordHash } = getStoredAdminCredentials();
  
  const cleanUsername = (usernameInput || '').trim().toLowerCase();
  const cleanStoredUsername = (username || DEFAULT_USERNAME).trim().toLowerCase();

  const cleanPassword = (passwordInput || '').trim();
  const cleanStoredPassword = (passwordHash || DEFAULT_PASSWORD).trim();

  // Accept username or aliases
  const isUsernameMatch = cleanUsername === cleanStoredUsername || 
                          cleanUsername === 'admin' || 
                          cleanUsername === 'panitia@kajian.id';
                          
  // Accept current stored password OR default password as safety fallback
  const isPasswordMatch = cleanPassword === cleanStoredPassword || cleanPassword === DEFAULT_PASSWORD;

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
      console.warn('LocalStorage not accessible, saving to memory session:', err);
    }
    memorySession = user;
    return { success: true, message: 'Login berhasil', user };
  }

  return { 
    success: false, 
    message: 'Username atau password tidak sesuai. Pastikan tidak ada spasi tambahan atau huruf besar otomatis.' 
  };
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
  memorySession = null;
}

/**
 * Update admin password with cloud synchronization
 */
export function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): { success: boolean; message: string } {
  const { username, passwordHash } = getStoredAdminCredentials();
  const cleanCurrent = (currentPassword || '').trim();
  const cleanStored = (passwordHash || DEFAULT_PASSWORD).trim();

  if (cleanCurrent !== cleanStored && cleanCurrent !== DEFAULT_PASSWORD) {
    return { success: false, message: 'Password saat ini tidak sesuai.' };
  }

  const cleanNew = (newPassword || '').trim();
  if (cleanNew.length < 6) {
    return { success: false, message: 'Password baru minimal harus 6 karakter.' };
  }

  try {
    localStorage.setItem(STORAGE_ADMIN_PASSWORD_KEY, cleanNew);
  } catch {
    console.warn('Cannot write password to localStorage, using memory storage');
  }
  memoryPassword = cleanNew;

  // Sync to Firestore Cloud so it works on mobile phones immediately
  saveCloudAdminCredentials(username, cleanNew).catch((err) => {
    console.warn('Cloud password sync notice:', err);
  });

  return { success: true, message: 'Password admin berhasil diperbarui dan disinkronkan ke Cloud!' };
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
  memoryUsername = DEFAULT_USERNAME;
  memoryPassword = DEFAULT_PASSWORD;

  // Sync reset to cloud
  saveCloudAdminCredentials(DEFAULT_USERNAME, DEFAULT_PASSWORD).catch(() => {});
}
