import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Users, FolderOpen, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { statusColors, statusEmojis } from '../lib/utils';

interface DashboardStats {
  totalProjects: number;
  totalModules: number;
  activeDevs: number;
  completedThisWeek: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalModules: 0,
    activeDevs: 0,
    completedThisWeek: 0,
  });
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [sprintData, setSprintData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects count
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Fetch modules count
      const { count: modulesCount } = await supabase
        .from('project_modules')
        .select('*', { count: 'exact', head: true });

      // Fetch active developers count
      const { count: devsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'dev');

      // Fetch modules by status
      const { data: modulesByStatus } = await supabase
        .from('project_modules')
        .select('status');

      // Process status data
      const statusCounts = {
        not_started: 0,
        in_progress: 0,
        blocked: 0,
        done: 0,
      };

      modulesByStatus?.forEach((module) => {
        statusCounts[module.status as keyof typeof statusCounts]++;
      });

      const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        color: status === 'not_started' ? '#9CA3AF' :
               status === 'in_progress' ? '#F59E0B' :
               status === 'blocked' ? '#EF4444' : '#10B981',
      }));

      // Fetch sprint data
      const { data: sprintModules } = await supabase
        .from('project_modules')
        .select('sprint, status');

      const sprintCounts: { [key: string]: any } = {};
      sprintModules?.forEach((module) => {
        if (!sprintCounts[module.sprint]) {
          sprintCounts[module.sprint] = {
            sprint: module.sprint,
            total: 0,
            completed: 0,
          };
        }
        sprintCounts[module.sprint].total++;
        if (module.status === 'done') {
          sprintCounts[module.sprint].completed++;
        }
      });

      const sprintChartData = Object.values(sprintCounts);

      setStats({
        totalProjects: projectsCount || 0,
        totalModules: modulesCount || 0,
        activeDevs: devsCount || 0,
        completedThisWeek: statusCounts.done,
      });

      setStatusData(statusChartData);
      setSprintData(sprintChartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.name}!</p>
        </div>
        <div className="text-sm text-gray-500">
          Role: <span className="font-medium capitalize text-orange-600">{profile?.role}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Modules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Developers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDevs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Modules by Status</CardTitle>
            <CardDescription>Distribution of module statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sprint Progress</CardTitle>
            <CardDescription>Completion rate by sprint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sprintData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprint" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#E5E7EB" name="Total" />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};