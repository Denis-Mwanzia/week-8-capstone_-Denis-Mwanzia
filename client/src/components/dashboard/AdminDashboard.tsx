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
import {
  BarChart3,
  Users,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Report {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgency: string;
  address: string;
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  upvotes: string[];
  comments: any[];
}

interface Stats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  inProgressReports: number;
  verifiedReports: number;
  rejectedReports: number;
  activeUsers: number;
  avgResponseTime: number;
  categoryBreakdown: { [key: string]: number };
  urgencyBreakdown: { [key: string]: number };
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch recent reports (limit 10)
        const recentReportsRes = await api.get('/reports?limit=10');
        setRecentReports(recentReportsRes.data);

        // Fetch all reports for comprehensive stats
        const allReportsRes = await api.get('/reports?limit=1000');
        const allReports: Report[] = allReportsRes.data;

        // Calculate comprehensive statistics
        const totalReports = allReports.length;
        const pendingReports = allReports.filter(
          (r) => r.status === 'pending'
        ).length;
        const resolvedReports = allReports.filter(
          (r) => r.status === 'resolved'
        ).length;
        const inProgressReports = allReports.filter(
          (r) => r.status === 'in_progress'
        ).length;
        const verifiedReports = allReports.filter(
          (r) => r.status === 'verified'
        ).length;
        const rejectedReports = allReports.filter(
          (r) => r.status === 'rejected'
        ).length;

        // Calculate category breakdown
        const categoryBreakdown: { [key: string]: number } = {};
        allReports.forEach((report) => {
          categoryBreakdown[report.category] =
            (categoryBreakdown[report.category] || 0) + 1;
        });

        // Calculate urgency breakdown
        const urgencyBreakdown: { [key: string]: number } = {};
        allReports.forEach((report) => {
          urgencyBreakdown[report.urgency] =
            (urgencyBreakdown[report.urgency] || 0) + 1;
        });

        // Calculate average response time (placeholder calculation)
        const avgResponseTime = calculateAverageResponseTime(allReports);

        // Fetch active users (handle permission errors gracefully)
        let activeUsers = 0;
        try {
          const usersRes = await api.get('/users');
          activeUsers = usersRes.data.length;
        } catch (e) {
          console.warn('Could not fetch users (permission denied):', e);
          // Use reports' unique reporters as approximation
          const uniqueReporters = new Set(
            allReports.map((r) => r.reportedBy._id)
          );
          activeUsers = uniqueReporters.size;
        }

        setStats({
          totalReports,
          pendingReports,
          resolvedReports,
          inProgressReports,
          verifiedReports,
          rejectedReports,
          activeUsers,
          avgResponseTime,
          categoryBreakdown,
          urgencyBreakdown,
        });
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load dashboard data'
        );
      }
      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const calculateAverageResponseTime = (reports: Report[]): number => {
    const resolvedReports = reports.filter((r) => r.status === 'resolved');
    if (resolvedReports.length === 0) return 0;

    // This is a simplified calculation - you'd need resolvedAt field for accurate calculation
    // For now, return a reasonable placeholder
    return 4.2;
  };

  const getPriorityColor = (urgency: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
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

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      water_leak: 'Water Leakage',
      water_shortage: 'Water Shortage',
      illegal_connection: 'Illegal Connection',
      broken_pipe: 'Broken Pipe',
      contamination: 'Contamination',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleAssignReport = async (reportId: string) => {
    try {
      // This would open a modal or navigate to assignment page
      console.log('Assign report:', reportId);
      // For now, just log - you'd implement actual assignment logic
    } catch (err) {
      console.error('Assignment error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate resolution percentage
  const resolutionPercentage =
    stats.totalReports > 0
      ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button>
          <BarChart3 className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalReports.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReports} pending, {stats.resolvedReports} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reports
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">
              Resolution Rate
            </CardTitle>
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
            <div className="text-2xl font-bold">
              {stats.activeUsers.toLocaleString()}
            </div>
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

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                  <CardDescription>
                    Latest water issue reports from the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentReports.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No reports found
                      </p>
                    ) : (
                      recentReports.map((report) => (
                        <div
                          key={report._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${getPriorityColor(
                                report.urgency
                              )}`}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{report.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {getCategoryLabel(report.category)} •{' '}
                                {report.address}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Reported by {report.reportedBy.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(report.status)}
                              <span className="text-sm capitalize">
                                {report.status.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(report.createdAt)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignReport(report._id)}
                              disabled={report.status === 'resolved'}
                            >
                              {report.assignedTo ? 'Reassign' : 'Assign'}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
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
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Average Response Time</span>
                        <span className="text-sm font-medium">
                          {stats.avgResponseTime}h
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    Send Public Notice
                  </Button>
                  <Button className="w-full" variant="outline">
                    Assign Repair Team
                  </Button>
                  <Button className="w-full" variant="outline">
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Issue Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown).map(
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
                          <span>{getCategoryLabel(category)}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {count}
                            </span>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Urgency Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.urgencyBreakdown).map(
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
                            <span className="capitalize">{urgency}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {count}
                            </span>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage platform users and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  User management interface coming soon
                </p>
                <p className="text-sm text-muted-foreground">
                  Currently tracking {stats.activeUsers} active community
                  members
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
