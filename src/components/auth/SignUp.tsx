import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

interface SignUpProps {
  onToggleMode: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  const { signUp } = useAuth();

  useEffect(() => {
    console.log('🚀 SignUp component mounted, fetching roles...');
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    console.log('📊 Fetching roles from database...');
    setRoles([]); // Clear existing roles
    
    try {
      console.log('🔍 Testing database connection...');
      
      // First, test if we can connect to Supabase at all
      const connectionTest = await supabase.auth.getSession();
      console.log('🔐 Auth session test:', connectionTest.error ? 'Failed' : 'Success');
      
      // Try to fetch roles with detailed logging
      console.log('📋 Attempting to fetch roles...');
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      console.log('📋 Roles fetch result:');
      console.log('  - Data:', data);
      console.log('  - Error:', error);
      console.log('  - Data length:', data?.length || 0);

      if (error) {
        console.error('❌ Error fetching roles:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        console.log('🔄 Using fallback roles due to database error');
        setRoles([
          { id: '1', name: 'admin' },
          { id: '2', name: 'dev' },
          { id: '3', name: 'pm' },
          { id: '4', name: 'cto' },
          { id: '5', name: 'lead' },
          { id: '6', name: 'designer' }
        ]);
      } else {
        if (data && data.length > 0) {
          setRoles(data);
          console.log('✅ Roles loaded successfully:', data.map(r => r.name));
        } else {
          console.log('⚠️ No roles found in database, using fallback');
          setRoles([
            { id: '1', name: 'admin' },
            { id: '2', name: 'dev' },
            { id: '3', name: 'pm' },
            { id: '4', name: 'cto' },
            { id: '5', name: 'lead' },
            { id: '6', name: 'designer' }
          ]);
        }
      }
    } catch (err) {
      console.error('💥 Unexpected error in fetchRoles:', err);
      console.log('🔄 Using fallback roles due to unexpected error');
      setRoles([
        { id: '1', name: 'admin' },
        { id: '2', name: 'dev' },
        { id: '3', name: 'pm' },
        { id: '4', name: 'cto' },
        { id: '5', name: 'lead' },
        { id: '6', name: 'designer' }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.name,
      formData.role
    );
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100 p-4"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            <span className="text-orange-500">⚡</span> JeuxBoard
          </CardTitle>
          <CardDescription>
            Create your developer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@jeux.com"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onToggleMode}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};