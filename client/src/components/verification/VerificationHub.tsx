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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  CheckCircle,
  X,
  Camera,
  MapPin,
  Award,
  Users,
  AlertTriangle,
  Clock,
  Eye,
  Menu,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface PendingReport {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  media: string[];
  upvotes: string[];
  comments: any[];
}

interface UserStats {
  totalVerified: number;
  weeklyVerified: number;
  accuracyRate: number;
  pointsEarned: number;
  userPoints: number;
}

// Helper function to format location
const formatLocation = (location: {
  type: string;
  coordinates: [number, number];
}): string => {
  if (location?.coordinates?.length === 2) {
    const [lng, lat] = location.coordinates;
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  return 'Unknown location';
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper function to get urgency color
const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const VerificationHub = () => {
  const { user } = useAuth();
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(
    null
  );
  const [verificationNotes, setVerificationNotes] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalVerified: 0,
    weeklyVerified: 0,
    accuracyRate: 0,
    pointsEarned: 0,
    userPoints: 0,
  });
  const { toast } = useToast();

  // Check if user has required permissions for verification
  const canVerify = user?.role === 'admin' || user?.role === 'verifier';

  useEffect(() => {
    if (!canVerify) return;

    fetchReports();
    fetchUserStats();
  }, [user, canVerify]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reports that are pending verification (status: pending)
      const res = await api.get('/reports?status=pending&limit=50');
      setPendingReports(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending reports');
      console.error('Failed to fetch reports:', err);
    }
    setLoading(false);
  };

  const fetchUserStats = async () => {
    try {
      // In a real implementation, you'd have a dedicated endpoint for verification stats
      // For now, we'll simulate this with existing data
      const userRes = await api.get(`/auth/profile`);
      const userData = userRes.data;

      setStats({
        totalVerified: userData.verificationsCount || 0,
        weeklyVerified: userData.weeklyVerifications || 12,
        accuracyRate: userData.verificationAccuracy || 94,
        pointsEarned: userData.weeklyPoints || 50,
        userPoints: userData.points || 350,
      });
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  const handleVerification = async (action: 'verify' | 'reject') => {
    if (!selectedReport) return;

    // For rejection, we need verification notes
    if (action === 'reject' && !verificationNotes.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this report.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      let response;

      if (action === 'verify') {
        // Use the dedicated verify endpoint
        response = await api.patch(`/reports/${selectedReport._id}/verify`);

        // If verification notes are provided, add them as a comment
        if (verificationNotes.trim()) {
          await api.post(`/reports/${selectedReport._id}/comments`, {
            text: `Verification notes: ${verificationNotes.trim()}${
              severity ? ` | Severity: ${severity}` : ''
            }`,
          });
        }
      } else {
        // Use the dedicated reject endpoint
        response = await api.patch(`/reports/${selectedReport._id}/reject`, {
          reason: verificationNotes.trim(),
        });
      }

      const actionText = action === 'verify' ? 'verified' : 'rejected';
      const pointsAwarded = action === 'verify' ? 10 : 5;

      toast({
        title: `Report ${actionText}`,
        description: `Report has been ${actionText} successfully. You earned ${pointsAwarded} points!`,
      });

      // Remove the report from pending list
      setPendingReports((prev) =>
        prev.filter((report) => report._id !== selectedReport._id)
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalVerified: prev.totalVerified + 1,
        weeklyVerified: prev.weeklyVerified + 1,
        pointsEarned: prev.pointsEarned + pointsAwarded,
        userPoints: prev.userPoints + pointsAwarded,
      }));

      // Reset form and close sheet on mobile
      setSelectedReport(null);
      setVerificationNotes('');
      setSeverity('');
      setSheetOpen(false);
    } catch (err: any) {
      console.error('Verification error:', err);

      let errorMessage = 'Failed to process verification';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    setSubmitting(false);
  };

  const addComment = async (reportId: string, text: string) => {
    try {
      await api.post(`/reports/${reportId}/comments`, { text });
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added to the report.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Add Comment',
        description: err.message || 'Could not add comment',
        variant: 'destructive',
      });
    }
  };

  const handleReportSelect = (report: PendingReport) => {
    setSelectedReport(report);
    setSheetOpen(true);
  };

  const VerificationPanel = () => (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline">{selectedReport?.category}</Badge>
          <Badge className={getUrgencyColor(selectedReport?.urgency || '')}>
            {selectedReport?.urgency}
          </Badge>
        </div>
        <h4 className="font-medium mb-2 text-lg">{selectedReport?.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {selectedReport?.description}
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Location</h4>
        <p className="text-sm text-muted-foreground">
          {selectedReport?.address}
        </p>
        <p className="text-xs text-muted-foreground">
          Coordinates:{' '}
          {selectedReport ? formatLocation(selectedReport.location) : ''}
        </p>
      </div>

      {selectedReport && selectedReport.media.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Attached Media</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedReport.media.map((mediaUrl, index) => (
              <div
                key={index}
                className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden"
              >
                {mediaUrl.toLowerCase().includes('image') ||
                mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={mediaUrl}
                    alt={`Report media ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling!.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Camera className="h-6 w-6 text-muted-foreground hidden" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Severity Assessment</label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger>
            <SelectValue placeholder="Rate severity (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Minor issue</SelectItem>
            <SelectItem value="2">2 - Moderate</SelectItem>
            <SelectItem value="3">3 - Significant</SelectItem>
            <SelectItem value="4">4 - Major problem</SelectItem>
            <SelectItem value="5">5 - Critical/Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Verification Notes
          <span className="text-red-500 ml-1">*</span>
          <span className="text-xs text-muted-foreground ml-1">
            (Required for rejection)
          </span>
        </label>
        <Textarea
          placeholder="Add your verification notes, additional observations, or context..."
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
          rows={4}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          className="flex-1"
          onClick={() => handleVerification('verify')}
          disabled={submitting}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {submitting ? 'Processing...' : 'Verify (+10 pts)'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleVerification('reject')}
          disabled={submitting}
        >
          <X className="h-4 w-4 mr-2" />
          {submitting ? 'Processing...' : 'Reject (+5 pts)'}
        </Button>
      </div>

      {selectedReport && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p>
                <strong>Reported by:</strong> {selectedReport.reportedBy.name}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(selectedReport.createdAt)}
              </p>
              <p>
                <strong>Community votes:</strong>{' '}
                {selectedReport.upvotes.length}
              </p>
              <p>
                <strong>Comments:</strong> {selectedReport.comments.length}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" size="sm" className="w-full">
                <MapPin className="h-3 w-3 mr-2" />
                View on Map
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const comment = prompt('Add a comment:');
                  if (comment?.trim()) {
                    addComment(selectedReport._id, comment.trim());
                  }
                }}
              >
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (!canVerify) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Access Restricted</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access the Verification Hub. Only
              admin and verifier roles can verify reports.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your current role:{' '}
              <Badge variant="outline">{user?.role || 'unknown'}</Badge>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Loading pending reports...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchReports}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Verification Hub</h1>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Award className="h-3 w-3" />
            <span>{stats.userPoints} Points</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {user?.role === 'admin' ? 'Administrator' : 'Community Verifier'}
          </Badge>
        </div>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {pendingReports.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Verified This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.weeklyVerified}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Accuracy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.accuracyRate}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Points Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              +{stats.pointsEarned}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Mobile First Design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Reports Awaiting Verification
              </CardTitle>
              <CardDescription>
                Help verify water issue reports from the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReports.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">
                    There are no reports pending verification at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {pendingReports.map((report) => (
                    <div
                      key={report._id}
                      className="p-3 md:p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleReportSelect(report)}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {report.category}
                          </Badge>
                          <Badge
                            className={`text-xs ${getUrgencyColor(
                              report.urgency
                            )}`}
                          >
                            {report.urgency}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{report.upvotes.length} votes</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-1 text-sm md:text-base">
                            {report.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.description}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{report.address}</span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
                            <span>by {report.reportedBy.name}</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(report.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {report.media.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Camera className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {report.media.length} photo(s) attached
                            </span>
                          </div>
                        )}

                        {/* Mobile view button */}
                        <div className="lg:hidden pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            View & Verify Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Verification Panel */}
        {selectedReport && (
          <div className="hidden lg:block space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verify Report</CardTitle>
              </CardHeader>
              <CardContent>
                <VerificationPanel />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Verification Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Verify Report</SheetTitle>
            <SheetDescription>
              Review and verify this community report
            </SheetDescription>
          </SheetHeader>
          <VerificationPanel />
        </SheetContent>
      </Sheet>
    </div>
  );
};
