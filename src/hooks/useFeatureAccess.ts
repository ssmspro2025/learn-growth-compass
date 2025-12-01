import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if a user has access to a specific feature based on cascading permissions
 * 
 * For teachers: Feature must be enabled by BOTH admin (for center) AND center (for teacher)
 * For center users: Feature must be enabled by admin
 * For admins: All features are accessible
 * For parents: Use student-based permissions
 */
export function useFeatureAccess() {
  const { user } = useAuth();

  const hasFeatureAccess = (featureName: string): boolean => {
    if (!user) return false;

    // Admin has access to all features
    if (user.role === 'admin') return true;

    // Center users check their center permissions
    if (user.role === 'center') {
      return user.centerPermissions?.[featureName] ?? true; // Default true if not set
    }

    // Teachers check cascaded permissions (both admin and center must enable)
    if (user.role === 'teacher') {
      return user.effectivePermissions?.[featureName] ?? true; // Default true if not set
    }

    // Parents - all features available by default
    if (user.role === 'parent') return true;

    return false;
  };

  return { hasFeatureAccess };
}
