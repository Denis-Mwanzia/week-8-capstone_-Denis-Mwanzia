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
import {
  Wrench,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload,
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
  comments: any[];
  media: string[];
}

export const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [workPhotos, setWorkPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignedReports = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all reports and filter assigned to this technician
        const res = await api.get('/reports');
        const filtered = res.data.filter(
          (r: Report) => r.assignedTo && r.assignedTo._id === user?.userId
        );
        setAssignedReports(filtered);
      } catch (err: any) {
        console.error('Fetch reports error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load assigned reports'
        );
      }
      setLoading(false);
    };

    if (user?.userId) {
      fetchAssignedReports();
    }
  }, [user]);

  const handleStatusUpdate = async () => {
    if (!selectedReport || !updateStatus) {
      toast({
        title: 'Missing Information',
        description: 'Please select a status to update.',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const updateData: any = {
        status:
          updateStatus === 'start-work'
            ? 'in_progress'
            : updateStatus === 'complete'
            ? 'resolved'
            : updateStatus,
      };

      // Add resolved timestamp if completing
      if (updateStatus === 'complete') {
        updateData.resolvedAt = new Date().toISOString();
      }

      // Add technical notes as a comment if provided
      if (techNotes.trim()) {
        await api.post(`/reports/${selectedReport._id}/comments`, {
          text: `[Technician Update] ${techNotes.trim()}`,
        });
      }

      // Update the report status
      const response = await api.patch(
        `/reports/${selectedReport._id}/status`,
        updateData
      );

      // Update local state
      setAssignedReports((prev) =>
        prev.map((report) =>
          report._id === selectedReport._id
            ? { ...report, ...response.data }
            : report
        )
      );

      toast({
        title: 'Status Updated Successfully',
        description: `Report "${
          selectedReport.title
        }" has been updated to ${updateStatus
          .replace('_', ' ')
          .replace('-', ' ')}.`,
      });

      // Reset form
      setUpdateStatus('');
      setTechNotes('');
      setWorkPhotos([]);
      setSelectedReport(null);
    } catch (err: any) {
      console.error('Status update error:', err);
      toast({
        title: 'Update Failed',
        description:
          err.response?.data?.message ||
          err.message ||
          'Failed to update report status.',
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

  // Calculate stats based on actual data
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading assigned reports...</p>
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

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Technician Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Upload Work Photos
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Tasks
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTodayCount}</div>
            <p className="text-xs text-muted-foreground">
              Tasks finished today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">
            Assigned Tasks ({assignedCount})
          </TabsTrigger>
          <TabsTrigger value="progress">
            In Progress ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Reports</CardTitle>
                  <CardDescription>
                    Water issues assigned to you for resolution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedReports.filter(
                      (r) => r.status === 'verified' || r.status === 'pending'
                    ).length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No new assignments
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Great job! All tasks are up to date.
                        </p>
                      </div>
                    ) : (
                      assignedReports
                        .filter(
                          (r) =>
                            r.status === 'verified' || r.status === 'pending'
                        )
                        .map((report) => (
                          <div
                            key={report._id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedReport?._id === report._id
                                ? 'border-primary bg-muted/50'
                                : ''
                            }`}
                            onClick={() => setSelectedReport(report)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-3 h-3 rounded-full ${getPriorityColor(
                                    report.urgency
                                  )} mt-1.5`}
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{report.title}</p>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {getCategoryLabel(report.category)}
                                  </p>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {report.description}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-xs text-muted-foreground">
                                      {report.address}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Reported by {report.reportedBy.name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge variant="outline" className="capitalize">
                                  {report.urgency}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(report.createdAt)}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(report.status)}
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {report.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedReport && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">
                        {selectedReport.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getCategoryLabel(selectedReport.category)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedReport.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Update Status
                      </label>
                      <Select
                        value={updateStatus}
                        onValueChange={setUpdateStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start-work">Start Work</SelectItem>
                          <SelectItem value="complete">
                            Mark Complete
                          </SelectItem>
                          <SelectItem value="rejected">
                            Report Issue/Unable to Complete
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Technical Notes
                      </label>
                      <Textarea
                        placeholder="Add technical notes, work completed, parts used, or issues encountered..."
                        value={techNotes}
                        onChange={(e) => setTechNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {workPhotos.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Work Photos
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {workPhotos.length} photo(s) selected
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleStatusUpdate}
                      disabled={!updateStatus || updating}
                    >
                      {updating ? 'Updating...' : 'Update Status'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Location & Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedReport.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Priority Level</p>
                        <Badge variant="outline" className="capitalize">
                          {selectedReport.urgency}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Reported</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedReport.createdAt)} by{' '}
                          {selectedReport.reportedBy.name}
                        </p>
                      </div>
                      {selectedReport.estimatedResolution && (
                        <div>
                          <p className="text-sm font-medium">
                            Target Resolution
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(
                              selectedReport.estimatedResolution
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedReport.upvotes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">
                            Community Support
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedReport.upvotes.length} community members
                            affected
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => getDirections(selectedReport.address)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Work in Progress</CardTitle>
              <CardDescription>Tasks currently being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedReports.filter((r) => r.status === 'in_progress')
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No tasks in progress
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Start working on assigned tasks to see them here.
                    </p>
                  </div>
                ) : (
                  assignedReports
                    .filter((r) => r.status === 'in_progress')
                    .map((report) => (
                      <div
                        key={report._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium">{report.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {getCategoryLabel(report.category)} •{' '}
                              {report.address}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Started: {formatDate(report.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {report.urgency}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            Update Progress
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
              <CardDescription>
                Successfully resolved water issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedReports.filter((r) => r.status === 'resolved')
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No completed tasks yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Complete assigned tasks to see them here.
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
                        className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{report.title}</p>
                            <p className="text-sm text-muted-foreground">
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
                          className="text-green-700 border-green-300"
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
    </div>
  );
};
