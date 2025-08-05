import React from 'react';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { AddProject } from './components/AddProject';
import { ProjectDetail } from './components/ProjectDetail';
import { Members } from './components/Members';
import { RoleProtected } from './components/RoleProtected';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { toasts, removeToast } = useToast();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading JeuxBoard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'signin' ? (
      <SignIn onToggleMode={() => setAuthMode('signup')} />
    ) : (
      <SignUp onToggleMode={() => setAuthMode('signin')} />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return (
          <Projects
            onViewProject={(id) => {
              if (id === 'add-project') {
                setCurrentPage('add-project');
              } else {
                setSelectedProjectId(id);
                setCurrentPage('project-detail');
              }
            }}
          />
        );
      case 'add-project':
        return (
          <RoleProtected allowedRoles={['admin']}>
            <AddProject
              onBack={() => setCurrentPage('projects')}
              onProjectAdded={() => setCurrentPage('projects')}
            />
          </RoleProtected>
        );
      case 'members':
        return (
          <RoleProtected allowedRoles={['admin']}>
            <Members />
          </RoleProtected>
        );
      case 'analytics':
        return (
          <RoleProtected allowedRoles={['admin', 'pm', 'cto']}>
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <p className="text-gray-600">Advanced analytics will be implemented here.</p>
              </div>
            </div>
          </RoleProtected>
        );
      case 'project-detail':
        return (
          selectedProjectId ? (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => setCurrentPage('projects')}
            />
          ) : (
            <div className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
                <p className="text-gray-600 mb-4">Please select a project to view details.</p>
                <button
                  onClick={() => setCurrentPage('projects')}
                  className="text-orange-500 hover:text-orange-600"
                >
                  ← Back to Projects
                </button>
              </div>
            </div>
          )
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
