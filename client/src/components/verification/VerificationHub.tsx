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
import { CheckCircle, X, Camera, MapPin, Award, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface PendingReport {
  id: string;
  type: string;
  description: string;
  location: string | { type: string; coordinates: [number, number] };
  reportedBy: string;
  reportedAt: string;
  media: string[];
  votes: number;
}

// Helper function to format location
const formatLocation = (
  loc: string | { type: string; coordinates: [number, number] }
): string => {
  if (typeof loc === 'string') return loc;
  if (loc?.coordinates?.length === 2)
    return `Lat: ${loc.coordinates[1]}, Lng: ${loc.coordinates[0]}`;
  return 'Unknown location';
};

export const VerificationHub = () => {
  const { user } = useAuth();
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/reports?status=pending');
        setPendingReports(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load pending reports');
      }
      setLoading(false);
    };
    fetchReports();
  }, [user]);

  const handleVerification = (action: 'verify' | 'reject') => {
    if (!selectedReport) return;

    const actionText = action === 'verify' ? 'verified' : 'rejected';

    toast({
      title: `Report ${actionText}`,
      description: `Report ${selectedReport.id} has been ${actionText}. You earned 10 points!`,
    });

    setSelectedReport(null);
    setVerificationNotes('');
    setSeverity('');
  };

  if (loading) {
    return <div className="p-8 text-center">Loading pending reports...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Verification Hub</h1>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Award className="h-3 w-3" />
            <span>350 Points</span>
          </Badge>
          <Badge variant="outline">Community Verifier</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Verified This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+50</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Reports Awaiting Verification</CardTitle>
              <CardDescription>
                Help verify water issue reports from the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingReports.map((report) => (
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
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{report.type}</Badge>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{report.votes} votes</span>
                          </div>
                        </div>
                        <p className="font-medium mb-1">{report.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{formatLocation(report.location)}</span>
                          </div>
                          <span>by {report.reportedBy}</span>
                          <span>{report.reportedAt}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Camera className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">
                            {report.media.length} photo(s) attached
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedReport && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verify Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{selectedReport.type}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatLocation(selectedReport.location)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Attached Media</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.media.map(
                      (media: string, index: number) => (
                        <div
                          key={index}
                          className="aspect-square bg-muted rounded-lg flex items-center justify-center"
                        >
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Severity Assessment
                  </label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rate severity" />
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
                  </label>
                  <Textarea
                    placeholder="Add your verification notes, additional observations, or context..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleVerification('verify')}
                    disabled={!severity}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify (+10 pts)
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleVerification('reject')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  <strong>Reported by:</strong> {selectedReport.reportedBy}
                </p>
                <p className="text-sm">
                  <strong>Date:</strong> {selectedReport.reportedAt}
                </p>
                <p className="text-sm">
                  <strong>Community votes:</strong> {selectedReport.votes}
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <MapPin className="h-3 w-3 mr-2" />
                    View on Map
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
