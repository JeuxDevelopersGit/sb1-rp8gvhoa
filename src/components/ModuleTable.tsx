import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Save, X, Trash2, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useToast } from '../hooks/useToast';
import { statusColors, statusEmojis, formatDate } from '../lib/utils';

interface Module {
  id: string;
  project_id: string;
  module_name: string;
  platform_stack: string;
  assigned_dev_id?: string;
  design_locked_date?: string;
  dev_start_date?: string;
  self_qa_date?: string;
  lead_signoff_date?: string;
  pm_review_date?: string;
  cto_review_status: 'pending' | 'approved' | 'rejected';
  client_ready_status: 'pending' | 'approved' | 'rejected';
  status: 'not_started' | 'in_progress' | 'blocked' | 'done';
  eta?: string;
  sprint: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  users?: { name: string };
}

interface ModuleTableProps {
  projectId: string;
}

export const ModuleTable: React.FC<ModuleTableProps> = ({ projectId }) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Module>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModule, setNewModule] = useState<Partial<Module>>({
    module_name: '',
    platform_stack: '',
    sprint: '',
    status: 'not_started',
    cto_review_status: 'pending',
    client_ready_status: 'pending',
  });

  useEffect(() => {
    fetchModules();
    fetchUsers();
  }, [projectId]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('project_modules')
        .select(`
          *,
          users:assigned_dev_id (name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .in('role', ['dev', 'lead'])
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const canEditField = (field: string, module: Module) => {
    if (!profile) return false;

    const fieldPermissions: { [key: string]: string[] } = {
      module_name: ['admin'],
      platform_stack: ['admin'],
      assigned_dev_id: ['admin'],
      design_locked_date: ['designer', 'admin'],
      dev_start_date: ['dev', 'admin'],
      self_qa_date: ['dev', 'admin'],
      lead_signoff_date: ['lead', 'admin'],
      pm_review_date: ['pm', 'admin'],
      cto_review_status: ['cto', 'admin'],
      client_ready_status: ['pm', 'admin'],
      status: ['dev', 'pm', 'admin'],
      eta: ['pm', 'admin'],
      sprint: ['pm', 'admin'],
      notes: ['admin', 'pm', 'dev', 'cto', 'lead', 'designer'],
    };

    const allowedRoles = fieldPermissions[field] || [];
    
    // Special case: assigned dev can edit their own modules
    if (field === 'dev_start_date' || field === 'self_qa_date') {
      return allowedRoles.includes(profile.role) || profile.id === module.assigned_dev_id;
    }

    return allowedRoles.includes(profile.role);
  };

  const handleAddModule = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('project_modules')
        .insert({
          ...newModule,
          project_id: projectId,
        });

      if (error) throw error;

      setNewModule({
        module_name: '',
        platform_stack: '',
        sprint: '',
        status: 'not_started',
        cto_review_status: 'pending',
        client_ready_status: 'pending',
      });
      setShowAddForm(false);
      fetchModules();
      showToast('Module added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding module:', error);
      showToast(error.message || 'Failed to add module', 'error');
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingId(module.id);
    setEditData(module);
  };

  const handleSaveModule = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('project_modules')
        .update({
          ...editData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      setEditData({});
      fetchModules();
      showToast('Module updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating module:', error);
      showToast(error.message || 'Failed to update module', 'error');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const { error } = await supabase
        .from('project_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      fetchModules();
      showToast('Module deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting module:', error);
      showToast(error.message || 'Failed to delete module', 'error');
    }
  };

  const renderEditableCell = (field: string, value: any, module: Module) => {
    const isEditing = editingId === module.id;
    const canEdit = canEditField(field, module);

    if (!isEditing || !canEdit) {
      if (field.includes('date') && value) {
        return (
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{formatDate(value)}</span>
          </div>
        );
      }
      if (field === 'assigned_dev_id') {
        return module.users?.name || 'Unassigned';
      }
      if (field === 'status') {
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[value]}`}>
            {statusEmojis[value]} {value.replace('_', ' ')}
          </span>
        );
      }
      if (field.includes('review_status')) {
        const statusIcon = value === 'approved' ? '✅' : value === 'rejected' ? '❌' : '⏳';
        return (
          <span className="flex items-center space-x-1">
            <span>{statusIcon}</span>
            <span className="capitalize">{value}</span>
          </span>
        );
      }
      return value || '-';
    }

    // Render editable input
    if (field.includes('date')) {
      return (
        <Input
          type="date"
          value={editData[field as keyof Module] || ''}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          className="w-full"
        />
      );
    }

    if (field === 'assigned_dev_id') {
      return (
        <Select
          value={editData[field] || ''}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        >
          <option value="">Unassigned</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </Select>
      );
    }

    if (field === 'status') {
      return (
        <Select
          value={editData[field] || 'not_started'}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </Select>
      );
    }

    if (field.includes('review_status')) {
      return (
        <Select
          value={editData[field as keyof Module] || 'pending'}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      );
    }

    return (
      <Input
        value={editData[field as keyof Module] || ''}
        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        className="w-full"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Module Button */}
      {(profile?.role === 'admin' || profile?.role === 'pm') && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>
      )}

      {/* Add Module Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 p-4 rounded-lg border"
        >
          <h3 className="font-medium text-gray-900 mb-4">Add New Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              placeholder="Module Name"
              value={newModule.module_name || ''}
              onChange={(e) => setNewModule({ ...newModule, module_name: e.target.value })}
            />
            <Input
              placeholder="Platform Stack"
              value={newModule.platform_stack || ''}
              onChange={(e) => setNewModule({ ...newModule, platform_stack: e.target.value })}
            />
            <Input
              placeholder="Sprint"
              value={newModule.sprint || ''}
              onChange={(e) => setNewModule({ ...newModule, sprint: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleAddModule}>
              <Save className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>
        </motion.div>
      )}

      {/* Modules Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stack</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dev</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Design</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dev Start</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">QA</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PM</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CTO</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ETA</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sprint</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('module_name', module.module_name, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('platform_stack', module.platform_stack, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('assigned_dev_id', module.assigned_dev_id, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('design_locked_date', module.design_locked_date, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('dev_start_date', module.dev_start_date, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('self_qa_date', module.self_qa_date, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('lead_signoff_date', module.lead_signoff_date, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('pm_review_date', module.pm_review_date, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('cto_review_status', module.cto_review_status, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('client_ready_status', module.client_ready_status, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('status', module.status, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('eta', module.eta, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  {renderEditableCell('sprint', module.sprint, module)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm">
                  <div className="flex space-x-1">
                    {editingId === module.id ? (
                      <>
                        <Button size="sm" onClick={handleSaveModule}>
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEditModule(module)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        {profile?.role === 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => handleDeleteModule(module.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modules.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
          <p className="text-gray-600">Add your first module to start tracking development progress.</p>
        </div>
      )}
    </div>
  );
};