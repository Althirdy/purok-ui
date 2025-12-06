/**
 * User Helper Functions
 * Utility functions for user-related operations
 */

import type { User } from '@/types';

/**
 * Get user initials from name
 */
export function getInitials(name?: string, fallback: string = 'PL'): string {
  if (!name) return fallback;
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Get full address from user object
 */
export function getFullAddress(user: User | null | undefined): string {
  if (!user) return 'No address provided';
  const parts = [user.address, user.purokName].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'No address provided';
}







