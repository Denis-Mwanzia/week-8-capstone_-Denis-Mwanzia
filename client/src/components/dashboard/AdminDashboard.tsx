import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Note: These UI components would normally be imported from shadcn/ui
// For this demo, we'll create simplified versions inline
const Select = ({ children, value, onValueChange }) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="w-full p-3 border rounded-md bg-background text-base"
  >
    {children}
  </select>
);
const SelectTrigger = ({ children }) => <div>{children}</div>;
const SelectValue = ({ placeholder }) => (
  <option value="" disabled>
    {placeholder}
  </option>
);
const SelectContent = ({ children }) => <>{children}</>;
const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);

const Dialog = ({ open, onOpenChange, children }) =>
  open ? (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  ) : null;
const DialogContent = ({ children, className }) => (
  <div className={`p-4 sm:p-6 ${className || ''}`}>{children}</div>
);
const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children }) => (
  <h3 className="text-lg font-semibold">{children}</h3>
);
const DialogDescription = ({ children }) => (
  <p className="text-sm text-gray-600 mt-1">{children}</p>
);
const DialogFooter = ({ children }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2 mt-6">
    {children}
  </div>
);

const Input = ({ className, ...props }) => (
  <input
    className={`w-full p-3 border rounded-md text-base ${className || ''}`}
    {...props}
  />
);
const Label = ({ children, className }) => (
  <label className={`block text-sm font-medium mb-2 ${className || ''}`}>
    {children}
  </label>
);
const Textarea = ({ className, ...props }) => (
  <textarea
    className={`w-full p-3 border rounded-md text-base ${className || ''}`}
    {...props}
  />
);

const Alert = ({ children, className }) => (
  <div
    className={`p-4 rounded-md border ${
      className || 'bg-red-50 border-red-200 text-red-800'
    }`}
  >
    {children}
  </div>
);

import {
  BarChart3,
  Users,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Search,
  Download,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  ThumbsUp,
  MapPin,
  Calendar,
  PieChart,
  Activity,
  Settings,
  Shield,
  Mail,
  Phone,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

// API service
const API_BASE_URL = 'http://localhost:5000/api';

const apiService = {
  // Get auth token from storage (you'll need to implement this based on your auth system)
  getAuthToken: () => {
    return localStorage.getItem('tukomaji_token');
  },

  // Generic API call with error handling
  apiCall: async (endpoint, options = {}) => {
    const token = apiService.getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // Reports API
  reports: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiService.apiCall(
        `/reports${queryString ? `?${queryString}` : ''}`
      );
    },

    getById: (id) => apiService.apiCall(`/reports/${id}`),

    updateStatus: (id, statusData) =>
      apiService.apiCall(`/reports/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }),

    assignReport: (id, assignData) =>
      apiService.apiCall(`/reports/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify(assignData),
      }),

    verifyReport: (id) =>
      apiService.apiCall(`/reports/${id}/verify`, {
        method: 'PATCH',
      }),

    rejectReport: (id, reason) =>
      apiService.apiCall(`/reports/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
  },

  // Users API (you'll need to create these endpoints)
  users: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiService.apiCall(
        `/users${queryString ? `?${queryString}` : ''}`
      );
    },

    getById: (id) => apiService.apiCall(`/users/${id}`),

    update: (id, updateData) =>
      apiService.apiCall(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }),

    delete: (id) =>
      apiService.apiCall(`/users/${id}`, {
        method: 'DELETE',
      }),
  },
};

export const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mobile state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isUserFiltersOpen, setIsUserFiltersOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Dialog states
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    reportId: '',
    assignedTo: '',
  });

  // Load initial data
  useEffect(() => {
    loadReports();
    loadUsers();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportsData = await apiService.reports.getAll({ limit: 100 });
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (error) {
      console.error('Failed to load reports:', error);
      setError('Failed to load reports: ' + error.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await apiService.users.getAll();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Don't show error for users if reports loaded successfully
      setUsers([]);
    }
  };

  // Calculate statistics
  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    resolvedReports: reports.filter((r) => r.status === 'resolved').length,
    inProgressReports: reports.filter((r) => r.status === 'in_progress').length,
    verifiedReports: reports.filter((r) => r.status === 'verified').length,
    rejectedReports: reports.filter((r) => r.status === 'rejected').length,
    activeUsers: users.filter((u) => u.status === 'active' || u.isActive)
      .length,
    avgResponseTime: 4.2, // This would need to be calculated from actual data
    categoryBreakdown: reports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {}),
    urgencyBreakdown: reports.reduce((acc, report) => {
      acc[report.urgency] = (acc[report.urgency] || 0) + 1;
      return acc;
    }, {}),
  };

  // Filter reports
  useEffect(() => {
    let filtered = reports.filter((report) => {
      const matchesStatus =
        statusFilter === 'all' || report.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || report.category === categoryFilter;
      const matchesUrgency =
        urgencyFilter === 'all' || report.urgency === urgencyFilter;
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.address.toLowerCase().includes(searchTerm.toLowerCase());
      return (
        matchesStatus && matchesCategory && matchesUrgency && matchesSearch
      );
    });
    setFilteredReports(filtered);
  }, [reports, statusFilter, categoryFilter, urgencyFilter, searchTerm]);

  // Filter users
  useEffect(() => {
    let filtered = users.filter((user) => {
      const matchesRole =
        userRoleFilter === 'all' || user.role === userRoleFilter;
      const matchesSearch =
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
    setFilteredUsers(filtered);
  }, [users, userRoleFilter, userSearchTerm]);

  const getPriorityColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      water_leak: 'Water Leakage',
      water_shortage: 'Water Shortage',
      illegal_connection: 'Illegal Connection',
      broken_pipe: 'Broken Pipe',
      contamination: 'Contamination',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      setLoading(true);
      await apiService.reports.updateStatus(reportId, { status: newStatus });

      // Update local state
      setReports((prev) =>
        prev.map((report) =>
          report._id === reportId
            ? {
                ...report,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : report
        )
      );

      // If dialog is open, update selected report
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Failed to update report status:', error);
      setError('Failed to update report status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReport = async (reportId, assignedToId) => {
    try {
      setLoading(true);
      await apiService.reports.assignReport(reportId, {
        technicianId: assignedToId,
      });

      // Reload reports to get updated data
      await loadReports();
      setIsAssignDialogOpen(false);
    } catch (error) {
      console.error('Failed to assign report:', error);
      setError('Failed to assign report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      setLoading(true);
      await apiService.users.update(userId, updates);

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, ...updates } : user
        )
      );
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Failed to update user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      await apiService.users.delete(userId);

      // Update local state
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Failed to delete user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportData = (type) => {
    const data = type === 'reports' ? filteredReports : filteredUsers;
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((item) =>
        Object.values(item)
          .map((val) => {
            if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val).replace(/"/g, '""');
            }
            return String(val).replace(/"/g, '""');
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolutionPercentage =
    stats.totalReports > 0
      ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => loadReports()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => exportData('reports')}
            className="w-full sm:w-auto"
            disabled={filteredReports.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button
            onClick={() => exportData('users')}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={filteredUsers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {error}
          <Button
            onClick={() => setError(null)}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Reports
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.totalReports.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReports} pending, {stats.resolvedReports} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.pendingReports}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.inProgressReports} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Resolution Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {resolutionPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.resolvedReports} of {stats.totalReports} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Community reporters</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="text-xs sm:text-sm">
            Reports ({filteredReports.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            Users ({filteredUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Reports Management Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Mobile Filters Toggle */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="w-full mb-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {isFiltersOpen ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>

          {/* Filters */}
          <Card className={`${!isFiltersOpen && 'hidden sm:block'}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="water_leak">Water Leakage</SelectItem>
                      <SelectItem value="water_shortage">
                        Water Shortage
                      </SelectItem>
                      <SelectItem value="broken_pipe">Broken Pipe</SelectItem>
                      <SelectItem value="contamination">
                        Contamination
                      </SelectItem>
                      <SelectItem value="illegal_connection">
                        Illegal Connection
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select
                    value={urgencyFilter}
                    onValueChange={setUrgencyFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Urgencies</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredReports.length} of {reports.length} reports
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Manage and track water issue reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && reports.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading reports...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {reports.length === 0
                        ? 'No reports available'
                        : 'No reports match your filters'}
                    </p>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3 sm:space-y-0"
                      >
                        <div className="flex items-start sm:items-center space-x-3 flex-1">
                          <div
                            className={`w-3 h-3 rounded-full ${getPriorityColor(
                              report.urgency
                            )} mt-1 sm:mt-0 flex-shrink-0`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {report.title}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-xs w-fit"
                              >
                                {getCategoryLabel(report.category)}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {report.address}
                                </span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {report.reportedBy?.name || 'Unknown'}
                                </span>
                              </span>
                              <div className="flex items-center space-x-3">
                                <span className="flex items-center space-x-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{report.upvotes?.length || 0}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{report.comments?.length || 0}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <div className="flex items-center justify-between sm:justify-start">
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(report.status)}
                              <span className="text-xs sm:text-sm capitalize">
                                {report.status.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground sm:hidden">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {formatDate(report.createdAt)}
                          </span>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReport(report);
                                setIsReportDialogOpen(true);
                              }}
                              className="flex-1 sm:flex-none"
                            >
                              <Eye className="h-3 w-3 sm:mr-0 mr-1" />
                              <span className="sm:hidden">View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAssignmentData({
                                  reportId: report._id,
                                  assignedTo: report.assignedTo?._id || '',
                                });
                                setIsAssignDialogOpen(true);
                              }}
                              disabled={report.status === 'resolved' || loading}
                              className="flex-1 sm:flex-none"
                            >
                              <Settings className="h-3 w-3 sm:mr-0 mr-1" />
                              <span className="sm:hidden">Assign</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <PieChart className="h-5 w-5" />
                  <span>Issue Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No data available
                    </p>
                  ) : (
                    Object.entries(stats.categoryBreakdown).map(
                      ([category, count]) => {
                        const percentage =
                          stats.totalReports > 0
                            ? Math.round((count / stats.totalReports) * 100)
                            : 0;
                        return (
                          <div
                            key={category}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm truncate pr-2">
                              {getCategoryLabel(category)}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-sm text-muted-foreground">
                                {count}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {percentage}%
                              </Badge>
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <TrendingUp className="h-5 w-5" />
                  <span>Urgency Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.urgencyBreakdown).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No data available
                    </p>
                  ) : (
                    Object.entries(stats.urgencyBreakdown).map(
                      ([urgency, count]) => {
                        const percentage =
                          stats.totalReports > 0
                            ? Math.round((count / stats.totalReports) * 100)
                            : 0;
                        return (
                          <div
                            key={urgency}
                            className="flex justify-between items-center"
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-3 h-3 rounded-full ${getPriorityColor(
                                  urgency
                                )}`}
                              />
                              <span className="capitalize text-sm">
                                {urgency}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-sm text-muted-foreground">
                                {count}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {percentage}%
                              </Badge>
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Activity className="h-5 w-5" />
                  <span>System Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Resolution Rate</span>
                      <span className="text-sm font-medium">
                        {resolutionPercentage}%
                      </span>
                    </div>
                    <Progress value={resolutionPercentage} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Pending Reports</span>
                      <span className="text-sm font-medium">
                        {stats.pendingReports}
                      </span>
                    </div>
                    <Progress
                      value={
                        stats.totalReports > 0
                          ? (stats.pendingReports / stats.totalReports) * 100
                          : 0
                      }
                      className="[&>div]:bg-yellow-500"
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="text-sm font-medium">
                        {stats.avgResponseTime}h
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  Report submission and resolution trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Chart visualization coming soon
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Integration with charting library like Recharts
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Reports by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Map visualization coming soon
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Integration with mapping service
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Mobile User Filters Toggle */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              onClick={() => setIsUserFiltersOpen(!isUserFiltersOpen)}
              className="w-full mb-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              User Filters
              {isUserFiltersOpen ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>

          {/* User Filters */}
          <Card className={`${!isUserFiltersOpen && 'hidden sm:block'}`}>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Management</span>
                </div>
                <Button className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Search Users</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role Filter</Label>
                  <Select
                    value={userRoleFilter}
                    onValueChange={setUserRoleFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="citizen">Citizens</SelectItem>
                      <SelectItem value="technician">Technicians</SelectItem>
                      <SelectItem value="admin">Administrators</SelectItem>
                      <SelectItem value="verifier">Verifiers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => exportData('users')}
                    variant="outline"
                    className="w-full"
                    disabled={filteredUsers.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Users
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage platform users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {users.length === 0
                      ? 'No users available'
                      : 'No users match your filters'}
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-start sm:items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium flex-shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {user.name || 'Unknown'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              <Badge
                                variant={
                                  user.role === 'admin'
                                    ? 'default'
                                    : user.role === 'technician'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {user.role || 'citizen'}
                              </Badge>
                              <Badge
                                variant={
                                  user.status === 'active' || user.isActive
                                    ? 'default'
                                    : 'destructive'
                                }
                                className="text-xs"
                              >
                                {user.status ||
                                  (user.isActive ? 'active' : 'inactive')}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {user.email || 'No email'}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>
                                Joined{' '}
                                {formatDate(user.createdAt || user.joinedAt)}
                              </span>
                            </span>
                            <span>
                              {user.reportsCount || user.points || 0} points
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <span className="text-xs text-muted-foreground text-center sm:text-left">
                          Last active{' '}
                          {formatDate(user.lastActive || user.updatedAt)}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserDialogOpen(true);
                            }}
                            className="flex-1 sm:flex-none"
                          >
                            <Eye className="h-3 w-3 sm:mr-0 mr-1" />
                            <span className="sm:hidden">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserDialogOpen(true);
                            }}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="h-3 w-3 sm:mr-0 mr-1" />
                            <span className="sm:hidden">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={loading}
                            className="flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-3 w-3 sm:mr-0 mr-1" />
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Details Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              View and manage report information
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {selectedReport.title}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 p-2">
                    {getStatusIcon(selectedReport.status)}
                    <span className="text-sm capitalize">
                      {selectedReport.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {getCategoryLabel(selectedReport.category)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Urgency</Label>
                  <div className="flex items-center space-x-2 p-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getPriorityColor(
                        selectedReport.urgency
                      )}`}
                    />
                    <span className="text-sm capitalize">
                      {selectedReport.urgency}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm bg-muted p-3 rounded">
                  {selectedReport.description}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm bg-muted p-2 rounded">
                  {selectedReport.address}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reported By</Label>
                  <div className="text-sm bg-muted p-2 rounded">
                    <p>{selectedReport.reportedBy?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedReport.reportedBy?.email || 'No email'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assigned To</Label>
                  <div className="text-sm bg-muted p-2 rounded">
                    <p>{selectedReport.assignedTo?.name || 'Unassigned'}</p>
                    {selectedReport.assignedTo && (
                      <p className="text-xs text-muted-foreground">
                        {selectedReport.assignedTo.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Upvotes</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {selectedReport.upvotes?.length || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Comments</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {selectedReport.comments?.length || 0}
                  </p>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Update Status
                </Label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Select
                    value={selectedReport.status}
                    onValueChange={(value) => {
                      handleUpdateReportStatus(selectedReport._id, value);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setAssignmentData({
                        reportId: selectedReport._id,
                        assignedTo: selectedReport.assignedTo?._id || '',
                      });
                      setIsAssignDialogOpen(true);
                    }}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {selectedReport.assignedTo ? 'Reassign' : 'Assign'}{' '}
                    Technician
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Report</DialogTitle>
            <DialogDescription>
              Select a technician to assign this report to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assign to</Label>
              <Select
                value={assignmentData.assignedTo}
                onValueChange={(value) =>
                  setAssignmentData({ ...assignmentData, assignedTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users
                    .filter(
                      (u) => u.role === 'technician' || u.role === 'admin'
                    )
                    .map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleAssignReport(
                  assignmentData.reportId,
                  assignmentData.assignedTo
                )
              }
              disabled={!assignmentData.assignedTo || loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and edit user information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={selectedUser.name || ''}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={selectedUser.email || ''}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select
                    value={selectedUser.role || 'citizen'}
                    onValueChange={(value) =>
                      setSelectedUser({ ...selectedUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="verifier">Verifier</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={
                      selectedUser.status ||
                      (selectedUser.isActive ? 'active' : 'inactive')
                    }
                    onValueChange={(value) =>
                      setSelectedUser({
                        ...selectedUser,
                        status: value,
                        isActive: value === 'active',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Points/Reports Count</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {selectedUser.reportsCount || selectedUser.points || 0}
                  </p>
                </div>
                <div>
                  <Label>Joined Date</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {formatDate(
                      selectedUser.createdAt || selectedUser.joinedAt
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUserDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUpdateUser(selectedUser._id, {
                    name: selectedUser.name,
                    email: selectedUser.email,
                    role: selectedUser.role,
                    status: selectedUser.status,
                    isActive: selectedUser.status === 'active',
                  });
                }
                setIsUserDialogOpen(false);
              }}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
