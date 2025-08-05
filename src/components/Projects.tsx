import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { statusColors, statusEmojis } from '../lib/utils';

interface Project {
  id: string;
  title: string;
  stack: string;
  sprint: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'done';
  notes?: string;
  created_at: string;
  created_by: string;
  users?: { name: string };
}

interface ProjectsProps {
  onViewProject: (projectId: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onViewProject }) => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sprintFilter, setSprintFilter] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users:created_by (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.stack.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    const matchesSprint = !sprintFilter || project.sprint === sprintFilter;
    
    return matchesSearch && matchesStatus && matchesSprint;
  });

  const uniqueSprints = [...new Set(projects.map(p => p.sprint))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your development projects</p>
        </div>
        {profile?.role === 'admin' && (
          <Button onClick={() => window.location.hash = 'add-project'}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </Select>
        <Select
          value={sprintFilter}
          onChange={(e) => setSprintFilter(e.target.value)}
        >
          <option value="">All Sprints</option>
          {uniqueSprints.map(sprint => (
            <option key={sprint} value={sprint}>{sprint}</option>
          ))}
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                    {statusEmojis[project.status]} {project.status.replace('_', ' ')}
                  </span>
                </div>
                <CardDescription>
                  <div className="space-y-1">
                    <p><strong>Stack:</strong> {project.stack}</p>
                    <p><strong>Sprint:</strong> {project.sprint}</p>
                    <p><strong>Created by:</strong> {project.users?.name || 'Unknown'}</p>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.notes && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {project.notes}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProject(project.id)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FolderOpen className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter || sprintFilter
              ? 'Try adjusting your filters'
              : 'Get started by creating your first project'
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};