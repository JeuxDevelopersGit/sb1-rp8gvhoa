import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { useToast } from '../hooks/useToast';

interface AddProjectProps {
  onBack: () => void;
  onProjectAdded: () => void;
}

export const AddProject: React.FC<AddProjectProps> = ({ onBack, onProjectAdded }) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    stack: '',
    sprint: '',
    notes: '',
    status: 'not_started' as const,
    members: [] as string[],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          stack: formData.stack,
          sprint: formData.sprint,
          notes: formData.notes,
          status: formData.status,
          created_by: profile.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add project members
      if (formData.members.length > 0) {
        const memberInserts = formData.members.map(userId => ({
          project_id: project.id,
          user_id: userId,
          role_in_project: 'member',
        }));

        const { error: membersError } = await supabase
          .from('project_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      showToast('Project created successfully!', 'success');
      onProjectAdded();
      onBack();
    } catch (error: any) {
      console.error('Error creating project:', error);
      showToast(error.message || 'Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Project</h1>
            <p className="text-gray-600">Create a new development project</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Fill in the project information and assign team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technology Stack *
                </label>
                <Input
                  value={formData.stack}
                  onChange={(e) => handleInputChange('stack', e.target.value)}
                  placeholder="e.g., React, Node.js, PostgreSQL"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint *
                </label>
                <Input
                  value={formData.sprint}
                  onChange={(e) => handleInputChange('sprint', e.target.value)}
                  placeholder="e.g., Sprint 1, Q1 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes or requirements..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Team Members
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.members.includes(user.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleMember(user.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.members.includes(user.id)}
                        onChange={() => toggleMember(user.id)}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onBack}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};