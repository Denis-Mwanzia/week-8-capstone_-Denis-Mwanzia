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
    className="w-full p-2 border rounded-md bg-background"
  >
    {children}
  </select>
);
const SelectTrigger = ({ children }) => <div>{children}</div>;
const SelectValue = ({ placeholder }) => <option value="" disabled>{placeholder}</option>;
const SelectContent = ({ children }) => <>{children}</>;
const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;

const Dialog = ({ open, onOpenChange, children }) => (
  open ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ) : null
);
const DialogContent = ({ children, className }) => <div className={`p-6 ${className || ''}`}>{children}</div>;
const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>;
const DialogDescription = ({ children }) => <p className="text-sm text-gray-600 mt-1">{children}</p>;
const DialogFooter = ({ children }) => <div className="flex justify-end space-x-2 mt-6">{children}</div>;

const Input = ({ className, ...props }) => (
  <input 
    className={`w-full p-2 border rounded-md ${className || ''}`} 
    {...props} 
  />
);
const Label = ({ children, className }) => (
  <label className={`block text-sm font-medium mb-1 ${className || ''}`}>{children}</label>
);
const Textarea = ({ className, ...props }) => (
  <textarea 
    className={`w-full p-2 border rounded-md ${className || ''}`} 
    {...props} 
  />
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
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockReports = [
  {
    _id: '1',
    title: 'Water pipe burst on Main Street',
    description: 'Large water pipe has burst causing flooding',
    category: 'broken_pipe',
    status: 'pending',
    urgency: 'critical',
    address: '123 Main Street, Downtown',
    reportedBy: { _id: '1', name: 'John Doe', email: 'john@example.com' },
    assignedTo: null,
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
    upvotes: ['1', '2', '3'],
    comments: [{ text: 'This needs immediate attention', author: 'Jane Smith' }],
    location: { lat: -1.2921, lng: 36.8219 }
  },
  {
    _id: '2',
    title: 'No water supply in residential area',
    description: 'Water shortage affecting entire neighborhood',
    category: 'water_shortage',
    status: 'in_progress',
    urgency: 'high',
    address: '456 Oak Avenue, Suburbs',
    reportedBy: { _id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    assignedTo: { _id: '3', name: 'Tech Team A', email: 'teama@water.gov' },
    createdAt: '2024-01-19T14:15:00Z',
    updatedAt: '2024-01-20T09:00:00Z',
    upvotes: ['1', '4'],
    comments: [],
    location: { lat: -1.3021, lng: 36.8319 }
  }
];

const mockUsers = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'citizen',
    status: 'active',
    joinedAt: '2024-01-15T00:00:00Z',
    reportsCount: 5,
    lastActive: '2024-01-20T10:30:00Z'
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'citizen',
    status: 'active',
    joinedAt: '2024-01-10T00:00:00Z',
    reportsCount: 3,
    lastActive: '2024-01-19T14:15:00Z'
  },
  {
    _id: '3',
    name: 'Tech Team A',
    email: 'teama@water.gov',
    role: 'technician',
    status: 'active',
    joinedAt: '2024-01-01T00:00:00Z',
    reportsCount: 0,
    lastActive: '2024-01-20T09:00:00Z'
  }
];

export const AdminDashboard = () => {
  const [reports, setReports] = useState(mockReports);
  const [users, setUsers] = useState(mockUsers);
  const [filteredReports, setFilteredReports] = useState(mockReports);
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);
  const [loading, setLoading] = useState(false);
  
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
  const [assignmentData, setAssignmentData] = useState({ reportId: '', assignedTo: '' });

  // Calculate statistics
  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    resolvedReports: reports.filter(r => r.status === 'resolved').length,
    inProgressReports: reports.filter(r => r.status === 'in_progress').length,
    verifiedReports: reports.filter(r => r.status === 'verified').length,
    rejectedReports: reports.filter(r => r.status === 'rejected').length,
    activeUsers: users.filter(u => u.status === 'active').length,
    avgResponseTime: 4.2,
    categoryBreakdown: reports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {}),
    urgencyBreakdown: reports.reduce((acc, report) => {
      acc[report.urgency] = (acc[report.urgency] || 0) + 1;
      return acc;
    }, {})
  };

  // Filter reports
  useEffect(() => {
    let filtered = reports.filter(report => {
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
      const matchesUrgency = urgencyFilter === 'all' || report.urgency === urgencyFilter;
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesCategory && matchesUrgency && matchesSearch;
    });
    setFilteredReports(filtered);
  }, [reports, statusFilter, categoryFilter, urgencyFilter, searchTerm]);

  // Filter users
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
      const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
    setFilteredUsers(filtered);
  }, [users, userRoleFilter, userSearchTerm]);

  const getPriorityColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'verified': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleUpdateReportStatus = (reportId, newStatus) => {
    setReports(prev => prev.map(report => 
      report._id === reportId ? { ...report, status: newStatus, updatedAt: new Date().toISOString() } : report
    ));
  };

  const handleAssignReport = (reportId, assignedTo) => {
    setReports(prev => prev.map(report => 
      report._id === reportId ? { 
        ...report, 
        assignedTo: users.find(u => u._id === assignedTo) || null,
        status: 'in_progress',
        updatedAt: new Date().toISOString()
      } : report
    ));
    setIsAssignDialogOpen(false);
  };

  const handleUpdateUser = (userId, updates) => {
    setUsers(prev => prev.map(user => 
      user._id === userId ? { ...user, ...updates } : user
    ));
  };

  const exportData = (type) => {
    const data = type === 'reports' ? filteredReports : filteredUsers;
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(item => Object.values(item).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : val
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolutionPercentage = stats.totalReports > 0 
    ? Math.round((stats.resolvedReports / stats.totalReports) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button onClick={() => exportData('reports')}>
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button onClick={() => exportData('users')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReports} pending, {stats.resolvedReports} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inProgressReports} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.resolvedReports} of {stats.totalReports} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Community reporters</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reports Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        {/* Reports Management Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
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
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="water_leak">Water Leakage</SelectItem>
                      <SelectItem value="water_shortage">Water Shortage</SelectItem>
                      <SelectItem value="broken_pipe">Broken Pipe</SelectItem>
                      <SelectItem value="contamination">Contamination</SelectItem>
                      <SelectItem value="illegal_connection">Illegal Connection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
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
              <CardDescription>Manage and track water issue reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No reports found</p>
                ) : (
                  filteredReports.map((report) => (
                    <div key={report._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(report.urgency)}`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium">{report.title}</p>
                            <Badge variant="outline">{getCategoryLabel(report.category)}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{report.address}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{report.reportedBy.name}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <ThumbsUp className="h-3 w-3" />
                              <span>{report.upvotes.length}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{report.comments.length}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(report.status)}
                          <span className="text-sm capitalize">{report.status.replace('_', ' ')}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsReportDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssignmentData({ reportId: report._id, assignedTo: report.assignedTo?._id || '' });
                              setIsAssignDialogOpen(true);
                            }}
                            disabled={report.status === 'resolved'}
                          >
                            <Settings className="h-3 w-3" />
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Issue Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
                    const percentage = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <span>{getCategoryLabel(category)}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{count}</span>
                          <Badge variant="secondary">{percentage}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Urgency Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.urgencyBreakdown).map(([urgency, count]) => {
                    const percentage = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                    return (
                      <div key={urgency} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(urgency)}`} />
                          <span className="capitalize">{urgency}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{count}</span>
                          <Badge variant="secondary">{percentage}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Resolution Rate</span>
                      <span className="text-sm font-medium">{resolutionPercentage}%</span>
                    </div>
                    <Progress value={resolutionPercentage} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Pending Reports</span>
                      <span className="text-sm font-medium">{stats.pendingReports}</span>
                    </div>
                    <Progress
                      value={stats.totalReports > 0 ? (stats.pendingReports / stats.totalReports) * 100 : 0}
                      className="[&>div]:bg-yellow-500"
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="text-sm font-medium">{stats.avgResponseTime}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Report submission and resolution trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chart visualization would go here</p>
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
                  <p className="text-muted-foreground">Map visualization would go here</p>
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
          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Management</span>
                </div>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Search Users</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
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
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="citizen">Citizens</SelectItem>
                      <SelectItem value="technician">Technicians</SelectItem>
                      <SelectItem value="admin">Administrators</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => exportData('users')} variant="outline" className="w-full">
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
              <CardDescription>Manage platform users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{user.name}</p>
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'technician' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                              {user.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{user.email}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Joined {formatDate(user.joinedAt)}</span>
                            </span>
                            <span>{user.reportsCount} reports</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          Last active {formatDate(user.lastActive)}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this user?')) {
                                setUsers(prev => prev.filter(u => u._id !== user._id));
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              View and manage report information
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm">{selectedReport.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedReport.status)}
                    <span className="text-sm capitalize">{selectedReport.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{getCategoryLabel(selectedReport.category)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Urgency</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedReport.urgency)}`} />
                    <span className="text-sm capitalize">{selectedReport.urgency}</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm bg-muted p-3 rounded">{selectedReport.description}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm">{selectedReport.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reported By</Label>
                  <p className="text-sm">{selectedReport.reportedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedReport.reportedBy.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assigned To</Label>
                  <p className="text-sm">{selectedReport.assignedTo?.name || 'Unassigned'}</p>
                  {selectedReport.assignedTo && (
                    <p className="text-xs text-muted-foreground">{selectedReport.assignedTo.email}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{formatDate(selectedReport.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Upvotes</Label>
                  <p className="text-sm">{selectedReport.upvotes.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Comments</Label>
                  <p className="text-sm">{selectedReport.comments.length}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Select
                  value={selectedReport.status}
                  onValueChange={(value) => {
                    handleUpdateReportStatus(selectedReport._id, value);
                    setSelectedReport({ ...selectedReport, status: value });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setAssignmentData({ reportId: selectedReport._id, assignedTo: selectedReport.assignedTo?._id || '' });
                    setIsAssignDialogOpen(true);
                  }}
                >
                  {selectedReport.assignedTo ? 'Reassign' : 'Assign'}
                </Button>
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
                onValueChange={(value) => setAssignmentData({ ...assignmentData, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.filter(u => u.role === 'technician' || u.role === 'admin').map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAssignReport(assignmentData.reportId, assignmentData.assignedTo)}
              disabled={!assignmentData.assignedTo}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and edit user information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedUser.status}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, status: value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reports Count</Label>
                  <p className="text-sm">{selectedUser.reportsCount}</p>
                </div>
                <div>
                  <Label>Joined Date</Label>
                  <p className="text-sm">{formatDate(selectedUser.joinedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUpdateUser(selectedUser._id, {
                    name: selectedUser.name,
                    email: selectedUser.email,
                    role: selectedUser.role,
                    status: selectedUser.status
                  });
                }
                setIsUserDialogOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};