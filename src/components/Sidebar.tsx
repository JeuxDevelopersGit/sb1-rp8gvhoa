import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FolderPlus, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Folder,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dev', 'pm', 'cto', 'lead', 'designer'] },
    { id: 'projects', label: 'Projects', icon: Folder, roles: ['admin', 'dev', 'pm', 'cto', 'lead', 'designer'] },
    { id: 'add-project', label: 'Add Project', icon: FolderPlus, roles: ['admin', 'pm'] },
    { id: 'members', label: 'Members', icon: Users, roles: ['admin'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'pm', 'cto'] },
  ];

  const filteredItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'bg-gray-900 text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between text-gray-300 hover:text-white"
        >
          {!collapsed && <span className="font-medium">Navigation</span>}
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    'w-full flex items-center px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && profile && (
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <p>Logged in as</p>
            <p className="font-medium text-gray-200 capitalize">{profile.role}</p>
          </div>
        </div>
      )}
    </motion.aside>
  );
};