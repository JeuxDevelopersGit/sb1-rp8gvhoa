import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-orange-500">⚡</span> JeuxBoard
          </h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Internal Project Management
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {profile && (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{profile.name}</p>
                  <p className="text-gray-500 capitalize">{profile.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};