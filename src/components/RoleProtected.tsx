import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleProtectedProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export const RoleProtected: React.FC<RoleProtectedProps> = ({
  children,
  allowedRoles,
  fallback = (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to view this content.</p>
      </div>
    </div>
  ),
}) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};