import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Save, X, Trash2, User, Mail, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { useToast } from '../hooks/useToast';

interface UserProfile {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const Members: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          });

        if (profileError) throw profileError;
      }

      setNewUser({ name: '', email: '', role: '', password: '' });
      setShowAddForm(false);
      fetchUsers();
      showToast('User added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding user:', error);
      showToast(error.message || 'Failed to add user', 'error');
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingId(user.id);
    setEditData(user);
  };

  const handleSaveUser = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editData.name,
          role: editData.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      setEditData({});
      fetchUsers();
      showToast('User updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast(error.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      fetchUsers();
      showToast('User deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'bg-red-100 text-red-800',
      cto: 'bg-purple-100 text-purple-800',
      pm: 'bg-blue-100 text-blue-800',
      lead: 'bg-green-100 text-green-800',
      dev: 'bg-yellow-100 text-yellow-800',
      designer: 'bg-pink-100 text-pink-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600">Manage your team and their roles</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Add New Team Member</CardTitle>
              <CardDescription>
                Create a new user account and assign their role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                <Select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))}
                </Select>
                <Input
                  type="password"
                  placeholder="Temporary Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  <Save className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      {editingId === user.id ? (
                        <Input
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="font-semibold"
                        />
                      ) : (
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      )}
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    {editingId === user.id ? (
                      <Select
                        value={editData.role || ''}
                        onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.name}>
                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>

                <div className="flex justify-end space-x-2">
                  {editingId === user.id ? (
                    <>
                      <Button size="sm" onClick={handleSaveUser}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      {user.id !== profile?.id && (
                        <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
          <p className="text-gray-600">Add your first team member to get started.</p>
        </div>
      )}
    </motion.div>
  );
};