import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Wrench,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload,
  UserPlus,
  X,
  RefreshCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Report {
  _id: string;
  title: string;
  description: string;
  category: string;
  address: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected';
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
  verifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  estimatedResolution?: string;
  upvotes: string[];
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    text: string;
    createdAt: string;
  }>;
  media: string[];
}

export const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [availableReports, setAvailableReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [estimatedResolution, setEstimatedResolution] = useState('');
  const [workPhotos, setWorkPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    // Fix: Check for both user.id and user._id to handle different response formats
    const userId = user?.id || user?._id;

    if (!userId) {
      setLoading(false);
      setError('User not authenticated. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.get('/reports');
      const reports = res.data || [];

      // Filter assigned reports (reports assigned to current user)
      const assigned = reports.filter(
        (r: Report) =>
          r.assignedTo &&
          (r.assignedTo._id === userId || r.assignedTo.id === userId)
      );

      // Filter available reports (verified reports not assigned to anyone)
      const available = reports.filter(
        (r: Report) => r.status === 'verified' && !r.assignedTo
      );

      setAssignedReports(assigned);
      setAvailableReports(available);
    } catch (err: any) {
      console.error('Fetch reports error:', err);
      let errorMessage = 'Failed to load reports';

      if (err.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleSelfAssign = async (reportId: string) => {
    const userId = user?.id || user?._id;

    if (!userId) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in again to assign reports.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update report status to assign technician
      const response = await api.patch(`/reports/${reportId}/status`, {
        assignedTo: userId,
        status: 'verified', // Keep as verified but now assigned
      });

      // Move from available to assigned
      const report = availableReports.find((r) => r._id === reportId);
      if (report) {
        const updatedReport = {
          ...response.data,
          assignedTo: {
            _id: userId,
            id: userId, // Add both for compatibility
            name: user?.name || '',
            email: user?.email || '',
          },
        };

        setAssignedReports((prev) => [...prev, updatedReport]);
        setAvailableReports((prev) => prev.filter((r) => r._id !== reportId));

        toast({
          title: 'Report Assigned',
          description: `You have been assigned to "${report.title}"`,
        });
      }
    } catch (err: any) {
      console.error('Self-assign error:', err);
      let errorMessage = 'Failed to assign report';

      if (err.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        title: 'Assignment Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport || !updateStatus) {
      toast({
        title: 'Missing Information',
        description: 'Please select a status to update.',
        variant: 'destructive',
      });
      return;
    }

    const userId = user?.id || user?._id;

    if (!userId) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in again to update reports.',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      // Determine the new status based on the action
      let newStatus = updateStatus;
      if (updateStatus === 'start-work') {
        newStatus = 'in_progress';
      } else if (updateStatus === 'complete') {
        newStatus = 'resolved';
      }

      // Prepare update data
      const updateData: any = {
        status: newStatus,
        assignedTo: userId,
      };

      // Add estimated resolution if provided
      if (estimatedResolution.trim()) {
        updateData.estimatedResolution = estimatedResolution.trim();
      }

      // Update the report status
      const response = await api.patch(
        `/reports/${selectedReport._id}/status`,
        updateData
      );

      // Add technical notes as a comment if provided
      if (techNotes.trim()) {
        await api.post(`/reports/${selectedReport._id}/comments`, {
          text: `[Technician Update] ${techNotes.trim()}`,
        });
      }

      // Update local state
      setAssignedReports((prev) =>
        prev.map((report) =>
          report._id === selectedReport._id
            ? { ...report, ...response.data }
            : report
        )
      );

      // Show success message
      const statusMessage = {
        in_progress: 'Work started',
        resolved: 'marked as resolved',
        rejected: 'marked as unable to complete',
      };

      toast({
        title: 'Status Updated Successfully',
        description: `Report "${selectedReport.title}" has been ${
          statusMessage[newStatus] || 'updated'
        }.`,
      });

      // Reset form
      setUpdateStatus('');
      setTechNotes('');
      setEstimatedResolution('');
      setWorkPhotos([]);
      setSelectedReport(null);

      // Refresh reports to get latest data
      await fetchReports();
    } catch (err: any) {
      console.error('Status update error:', err);
      let errorMessage = 'Failed to update report status';

      if (err.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    setUpdating(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setWorkPhotos(files);
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
      case 'verified':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
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

  const getDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Calculate stats
  const assignedCount = assignedReports.filter(
    (r) => r.status === 'verified' || r.status === 'pending'
  ).length;
  const inProgressCount = assignedReports.filter(
    (r) => r.status === 'in_progress'
  ).length;
  const completedTodayCount = assignedReports.filter((r) => {
    if (r.status !== 'resolved' || !r.resolvedAt) return false;
    const resolvedDate = new Date(r.resolvedAt);
    const today = new Date();
    return resolvedDate.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4 text-sm">{error}</p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button onClick={() => fetchReports()} className="flex-1">
              Retry
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Clear local storage and reload
                localStorage.removeItem('tukomaji_token');
                window.location.reload();
              }}
            >
              Re-login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated at this point, show login message
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4 text-sm">
            Please log in to access the technician dashboard.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              // Redirect to login or reload to trigger auth
              window.location.reload();
            }}
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Technician Dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome back, {user?.name}
            </p>
          </div>
          <Button
            onClick={fetchReports}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                My Tasks
              </CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {assignedCount}
              </div>
              <p className="text-xs text-muted-foreground">Assigned to me</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Available
              </CardTitle>
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {availableReports.length}
              </div>
              <p className="text-xs text-muted-foreground">Not assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                In Progress
              </CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {inProgressCount}
              </div>
              <p className="text-xs text-muted-foreground">Working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Today
              </CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {completedTodayCount}
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="assigned" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 min-w-[400px] sm:min-w-0">
              <TabsTrigger value="assigned" className="text-xs sm:text-sm">
                My Tasks ({assignedCount})
              </TabsTrigger>
              <TabsTrigger value="available" className="text-xs sm:text-sm">
                Available ({availableReports.length})
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-xs sm:text-sm">
                Progress ({inProgressCount})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Done
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Assigned Tasks Tab */}
          <TabsContent value="assigned" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  My Assigned Tasks
                </CardTitle>
                <CardDescription className="text-sm">
                  Reports assigned to me
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {assignedReports.filter(
                    (r) => r.status === 'verified' || r.status === 'pending'
                  ).length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm sm:text-base">
                        No assigned tasks
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Check the "Available" tab to self-assign reports
                      </p>
                    </div>
                  ) : (
                    assignedReports
                      .filter(
                        (r) => r.status === 'verified' || r.status === 'pending'
                      )
                      .map((report) => (
                        <div
                          key={report._id}
                          className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedReport?._id === report._id
                              ? 'border-primary bg-muted/50'
                              : ''
                          }`}
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                              <div
                                className={`w-3 h-3 rounded-full ${getPriorityColor(
                                  report.urgency
                                )} mt-1.5 flex-shrink-0`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">
                                  {report.title}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                  {getCategoryLabel(report.category)}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                  {report.description}
                                </p>
                                <div className="flex items-center space-x-1 sm:space-x-2 mt-2">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground truncate">
                                    {report.address}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {report.urgency}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(report.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Tasks Tab */}
          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  Available Reports
                </CardTitle>
                <CardDescription className="text-sm">
                  Verified reports that need a technician
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {availableReports.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm sm:text-base">
                        No available reports
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        All reports are assigned or resolved
                      </p>
                    </div>
                  ) : (
                    availableReports.map((report) => (
                      <div
                        key={report._id}
                        className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div
                              className={`w-3 h-3 rounded-full ${getPriorityColor(
                                report.urgency
                              )} mt-1.5 flex-shrink-0`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base">
                                {report.title}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                {getCategoryLabel(report.category)}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                                {report.description}
                              </p>
                              <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {report.address}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Reported by {report.reportedBy.name} •{' '}
                                {formatDate(report.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end space-x-2 sm:space-x-0 sm:space-y-2 w-full sm:w-auto">
                            <Badge
                              variant="outline"
                              className="capitalize text-xs"
                            >
                              {report.urgency}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* In Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  Work in Progress
                </CardTitle>
                <CardDescription className="text-sm">
                  Tasks currently being worked on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {assignedReports.filter((r) => r.status === 'in_progress')
                    .length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm sm:text-base">
                        No tasks in progress
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Start working on assigned tasks to see them here
                      </p>
                    </div>
                  ) : (
                    assignedReports
                      .filter((r) => r.status === 'in_progress')
                      .map((report) => (
                        <div
                          key={report._id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {report.title}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {getCategoryLabel(report.category)} •{' '}
                                {report.address}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Started: {formatDate(report.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-row items-center space-x-2 w-full sm:w-auto">
                            <Badge
                              variant="outline"
                              className="capitalize text-xs"
                            >
                              {report.urgency}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                              className="flex-1 sm:flex-none text-xs"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  Completed Tasks
                </CardTitle>
                <CardDescription className="text-sm">
                  Successfully resolved water issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {assignedReports.filter((r) => r.status === 'resolved')
                    .length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm sm:text-base">
                        No completed tasks yet
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Complete assigned tasks to see them here
                      </p>
                    </div>
                  ) : (
                    assignedReports
                      .filter((r) => r.status === 'resolved')
                      .sort(
                        (a, b) =>
                          new Date(b.resolvedAt || b.updatedAt).getTime() -
                          new Date(a.resolvedAt || a.updatedAt).getTime()
                      )
                      .map((report) => (
                        <div
                          key={report._id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg bg-green-50/50 gap-3"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {report.title}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {getCategoryLabel(report.category)} •{' '}
                                {report.address}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Completed:{' '}
                                {report.resolvedAt
                                  ? formatDate(report.resolvedAt)
                                  : formatDate(report.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-green-700 border-green-300 text-xs"
                          >
                            Resolved
                          </Badge>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Update Modal/Panel */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
            <Card className="w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <CardHeader className="relative pb-4">
                <CardTitle className="text-lg sm:text-xl pr-8">
                  Update Status
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => {
                    setSelectedReport(null);
                    setUpdateStatus('');
                    setTechNotes('');
                    setEstimatedResolution('');
                    setWorkPhotos([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">
                    {selectedReport.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {getCategoryLabel(selectedReport.category)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedReport.status === 'verified' && (
                        <SelectItem value="start-work">Start Work</SelectItem>
                      )}
                      <SelectItem value="complete">Mark Complete</SelectItem>
                      <SelectItem value="rejected">
                        Unable to Complete
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Technical Notes</label>
                  <Textarea
                    placeholder="Add technical notes, work completed, parts used, or issues encountered..."
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>

                {(updateStatus === 'start-work' ||
                  updateStatus === 'complete') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Estimated Resolution Time
                    </label>
                    <Input
                      placeholder="e.g., 2 hours, Tomorrow, Within 3 days"
                      value={estimatedResolution}
                      onChange={(e) => setEstimatedResolution(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Work Photos (Optional)
                  </label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer text-sm"
                  />
                  {workPhotos.length > 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {workPhotos.length} photo(s) selected
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-sm"
                    onClick={() => {
                      setSelectedReport(null);
                      setUpdateStatus('');
                      setTechNotes('');
                      setEstimatedResolution('');
                      setWorkPhotos([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 text-sm"
                    onClick={handleStatusUpdate}
                    disabled={!updateStatus || updating}
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      {selectedReport.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority Level</p>
                    <Badge variant="outline" className="capitalize text-xs">
                      {selectedReport.urgency}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current Status</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedReport.status)}
                      <span className="text-xs sm:text-sm capitalize">
                        {selectedReport.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reported</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(selectedReport.createdAt)} by{' '}
                      {selectedReport.reportedBy.name}
                    </p>
                  </div>
                  {selectedReport.upvotes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Community Support</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {selectedReport.upvotes.length} community members
                        affected
                      </p>
                    </div>
                  )}
                  {selectedReport.estimatedResolution && (
                    <div>
                      <p className="text-sm font-medium">
                        Estimated Resolution
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {selectedReport.estimatedResolution}
                      </p>
                    </div>
                  )}
                  {selectedReport.comments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Recent Comments</p>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {selectedReport.comments.slice(-3).map((comment) => (
                          <div key={comment._id} className="text-xs">
                            <p className="font-medium">{comment.user.name}</p>
                            <p className="text-muted-foreground break-words">
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => getDirections(selectedReport.address)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
