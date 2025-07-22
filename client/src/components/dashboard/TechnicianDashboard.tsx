import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, MapPin, Clock, CheckCircle, AlertTriangle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssignedReport {
  id: string;
  type: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  status: 'assigned' | 'in-progress' | 'completed';
  assignedAt: string;
  estimatedTime?: string;
}

const mockAssignedReports: AssignedReport[] = [
  {
    id: '1',
    type: 'Water Leakage',
    description: 'Large water pipe burst causing street flooding',
    location: 'Kenyatta Avenue, CBD',
    priority: 'high',
    status: 'assigned',
    assignedAt: '2024-01-20 09:00'
  },
  {
    id: '2',
    type: 'Broken Pipe',
    description: 'Water pipe damaged by construction work',
    location: 'Westlands, Parklands Road',
    priority: 'medium',
    status: 'in-progress',
    assignedAt: '2024-01-19 14:30',
    estimatedTime: '4 hours'
  },
  {
    id: '3',
    type: 'Water Shortage',
    description: 'Valve replacement needed at distribution point',
    location: 'Eastleigh, Section 1',
    priority: 'low',
    status: 'completed',
    assignedAt: '2024-01-18 11:15'
  }
];

export const TechnicianDashboard = () => {
  const [selectedReport, setSelectedReport] = useState<AssignedReport | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const { toast } = useToast();

  const handleStatusUpdate = () => {
    if (!selectedReport || !updateStatus) return;

    toast({
      title: "Status updated",
      description: `Report ${selectedReport.id} status changed to ${updateStatus}`,
    });

    setUpdateStatus('');
    setTechNotes('');
    setSelectedReport(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const assignedCount = mockAssignedReports.filter(r => r.status === 'assigned').length;
  const inProgressCount = mockAssignedReports.filter(r => r.status === 'in-progress').length;
  const completedCount = mockAssignedReports.filter(r => r.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Technician Dashboard</h1>
        <Button>
          <Camera className="h-4 w-4 mr-2" />
          Upload Work Photos
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedCount}</div>
            <p className="text-xs text-muted-foreground">New assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Tasks finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Tasks</TabsTrigger>
          <TabsTrigger value="progress">Work Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Reports</CardTitle>
                  <CardDescription>Water issues assigned to you for resolution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAssignedReports.filter(r => r.status === 'assigned').map((report) => (
                      <div 
                        key={report.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedReport?.id === report.id ? 'border-primary bg-muted/50' : ''
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(report.priority)} mt-1.5`} />
                            <div>
                              <p className="font-medium">{report.type}</p>
                              <p className="text-sm text-muted-foreground">{report.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">{report.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="outline" className="capitalize">{report.priority}</Badge>
                            <span className="text-xs text-muted-foreground">{report.assignedAt}</span>
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
                    <CardTitle>Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{selectedReport.type}</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={updateStatus} onValueChange={setUpdateStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-progress">Start Work</SelectItem>
                          <SelectItem value="completed">Mark Complete</SelectItem>
                          <SelectItem value="needs-parts">Need Parts</SelectItem>
                          <SelectItem value="escalate">Escalate Issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Technical Notes</label>
                      <Textarea
                        placeholder="Add technical notes, estimated time, or issues encountered..."
                        value={techNotes}
                        onChange={(e) => setTechNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleStatusUpdate}
                      disabled={!updateStatus}
                    >
                      Update Status
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Location Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Address:</strong> {selectedReport.location}</p>
                      <p className="text-sm"><strong>Priority:</strong> 
                        <Badge variant="outline" className="ml-2 capitalize">
                          {selectedReport.priority}
                        </Badge>
                      </p>
                      <p className="text-sm"><strong>Assigned:</strong> {selectedReport.assignedAt}</p>
                      {selectedReport.estimatedTime && (
                        <p className="text-sm"><strong>Est. Time:</strong> {selectedReport.estimatedTime}</p>
                      )}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
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
                {mockAssignedReports.filter(r => r.status === 'in-progress').map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{report.type}</p>
                        <p className="text-sm text-muted-foreground">{report.location}</p>
                        {report.estimatedTime && (
                          <p className="text-xs text-muted-foreground">Est: {report.estimatedTime}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm">Update Progress</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
              <CardDescription>Successfully resolved water issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAssignedReports.filter(r => r.status === 'completed').map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{report.type}</p>
                        <p className="text-sm text-muted-foreground">{report.location}</p>
                        <p className="text-xs text-muted-foreground">Completed: {report.assignedAt}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};