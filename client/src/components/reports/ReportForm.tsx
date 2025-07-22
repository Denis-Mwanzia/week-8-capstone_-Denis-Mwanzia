import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ReportForm = () => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    address: '',
    coordinates: { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi
    media: [] as File[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'leakage', label: 'Water Leakage' },
    { value: 'shortage', label: 'Water Shortage' },
    { value: 'illegal-tap', label: 'Illegal Water Connection' },
    { value: 'broken-pipe', label: 'Broken Pipe/Infrastructure' },
    { value: 'contamination', label: 'Water Contamination' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast({
        title: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Mock submission - in real app, this would upload to your API
    setTimeout(() => {
      toast({
        title: "Report submitted successfully!",
        description: "Your water issue report has been received. You'll be notified of updates.",
      });
      
      // Reset form
      setFormData({
        category: '',
        description: '',
        address: '',
        coordinates: { lat: -1.2921, lng: 36.8219 },
        media: []
      });
      
      setIsLoading(false);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, media: files }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          toast({
            title: "Location detected",
            description: "Your current location has been set for this report.",
          });
        },
        () => {
          toast({
            title: "Location access denied",
            description: "Please enter the address manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Report Water Issue</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Issue Category *</Label>
              <Select value={formData.category} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of water issue" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Photos/Videos</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Input
                  id="media"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label htmlFor="media" className="cursor-pointer">
                  <span className="text-primary hover:underline">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </Label>
                {formData.media.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formData.media.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Location/Address</Label>
              <div className="flex space-x-2">
                <Input
                  id="address"
                  placeholder="Enter the location or address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={getCurrentLocation}>
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Coordinates: {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the water issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting Report..." : "Submit Report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};