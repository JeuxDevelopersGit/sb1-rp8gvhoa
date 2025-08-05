import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit2, Save, X, Trash2, Users, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { ModuleTable } from './ModuleTable';
import { useToast } from '../hooks/useToast';
import { statusColors, statusEmojis, formatDate } from '../lib/utils';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

interface Project {
  id: string;
  title: string;
  stack: string;
  sprint: string;
  notes?: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'done';
  created_at: string;
  created_by: string;
  users?: { name: string };
}

interface ProjectMember {
  id: string;
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  role_in_project: string;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Project>>({});

  useEffect(() => {
    fetchProjectDetails();
    fetchProjectMembers();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users:created_by (name)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
      setEditData(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      showToast('Failed to load project details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          role_in_project,
          users (
            id,
            name,
            email,
            role
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const handleSaveProject = async () => {
    if (!project || !profile) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editData.title,
          stack: editData.stack,
          sprint: editData.sprint,
          notes: editData.notes,
          status: editData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      setProject({ ...project, ...editData });
      setEditing(false);
      showToast('Project updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating project:', error);
      showToast(error.message || 'Failed to update project', 'error');
    }
  };

  const canEditProject = () => {
    return profile?.role === 'admin' || profile?.role === 'pm';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600">Project Details & Module Management</p>
          </div>
        </div>
        {canEditProject() && (
          <div className="flex space-x-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProject}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Project
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Project Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Basic project details and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title
                    </label>
                    <Input
                      value={editData.title || ''}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technology Stack
                    </label>
                    <Input
                      value={editData.stack || ''}
                      onChange={(e) => setEditData({ ...editData, stack: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sprint
                    </label>
                    <Input
                      value={editData.sprint || ''}
                      onChange={(e) => setEditData({ ...editData, sprint: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select
                      value={editData.status || 'not_started'}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Technology Stack</p>
                      <p className="text-gray-900">{project.stack}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sprint</p>
                      <p className="text-gray-900">{project.sprint}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                        {statusEmojis[project.status]} {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <p className="text-gray-900">{formatDate(project.created_at)}</p>
                    </div>
                  </div>
                  {project.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{project.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Members
              </CardTitle>
              <CardDescription>
                Project team and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {member.users.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.users.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.users.role}</p>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-gray-500 text-sm">No team members assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Modules</CardTitle>
          <CardDescription>
            Manage individual modules and their development lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleTable projectId={projectId} />
        </CardContent>
      </Card>
    </motion.div>
  );
};