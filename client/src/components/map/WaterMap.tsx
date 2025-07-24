import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import api from '@/lib/api';

interface WaterReport {
  id: string;
  category: string;
  description: string;
  address: string;
  coordinates: { lat: number; lng: number };
  status: 'pending' | 'verified' | 'in-progress' | 'resolved';
  votes: number;
  createdAt: string;
  reportedBy: string;
}

export const WaterMap = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/reports?limit=100');
        setReports(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load reports');
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const statusMatch =
      statusFilter === 'all' || report.status === statusFilter;
    const categoryMatch =
      categoryFilter === 'all' || report.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'verified':
        return <Users className="h-4 w-4" />;
      case 'in-progress':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'verified':
        return 'bg-blue-500';
      case 'in-progress':
        return 'bg-orange-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading map data...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Water Issues Map</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Water Leakage">Water Leakage</SelectItem>
                    <SelectItem value="Water Shortage">
                      Water Shortage
                    </SelectItem>
                    <SelectItem value="Illegal Water Connection">
                      Illegal Connection
                    </SelectItem>
                    <SelectItem value="Broken Pipe">Broken Pipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mock Map Container */}
              <div className="w-full h-96 bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 opacity-50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="h-12 w-12 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Interactive Map
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filteredReports.length} reports shown
                    </p>
                  </div>
                </div>

                {/* Mock Markers */}
                {filteredReports.slice(0, 4).map((report, index) => (
                  <div
                    key={report.id}
                    className={`absolute w-4 h-4 rounded-full ${getStatusColor(
                      report.status
                    )} cursor-pointer transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg hover:scale-125 transition-transform`}
                    style={{
                      left: `${20 + index * 20}%`,
                      top: `${30 + index * 15}%`,
                    }}
                    onClick={() => setSelectedReport(report)}
                    title={report.description}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Droplets className="h-5 w-5" />
                <span>Recent Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedReport?.id === report.id
                        ? 'border-primary bg-muted/50'
                        : ''
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          report.status
                        )} mt-1.5`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {report.category}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            {getStatusIcon(report.status)}
                            <span className="capitalize">
                              {report.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {report.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.address}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {report.createdAt}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span className="text-xs">{report.votes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedReport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge variant="outline">{selectedReport.category}</Badge>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusIcon(selectedReport.status)}
                      <span className="capitalize text-sm">
                        {selectedReport.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.address}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Reported by</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.reportedBy}
                    </p>
                  </div>
                  <Button className="w-full mt-4">
                    <Users className="h-4 w-4 mr-2" />
                    Upvote ({selectedReport.votes})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
