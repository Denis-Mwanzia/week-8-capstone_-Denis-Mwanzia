import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Camera, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const ReportForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    address: '',
    coordinates: { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi
    media: [] as File[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const categories = [
    { value: 'water_leak', label: 'Water Leakage' },
    { value: 'water_shortage', label: 'Water Shortage' },
    { value: 'illegal_connection', label: 'Illegal Water Connection' },
    { value: 'broken_pipe', label: 'Broken Pipe/Infrastructure' },
    { value: 'contamination', label: 'Water Contamination' },
  ];

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push('Title is required');
    }

    if (!formData.category) {
      errors.push('Category is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (!formData.address.trim()) {
      errors.push('Address is required');
    }

    // Check if coordinates are valid (not just default)
    if (!formData.coordinates.lat || !formData.coordinates.lng) {
      errors.push('Location coordinates are required');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: 'Please fill in all required fields',
        description: validationErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('category', formData.category);
      data.append('description', formData.description.trim());
      data.append('address', formData.address.trim());

      // FIX: Send location as JSON string - this is what your backend expects
      const locationData = {
        type: 'Point',
        coordinates: [
          Number(formData.coordinates.lng), // longitude first (GeoJSON format)
          Number(formData.coordinates.lat), // latitude second
        ],
      };
      data.append('location', JSON.stringify(locationData));

      // Add media files
      formData.media.forEach((file) => data.append('media', file));

      await api.post('/reports', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Report submitted successfully!',
        description:
          "Your water issue report has been received. You'll be notified of updates.",
      });

      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        address: '',
        coordinates: { lat: -1.2921, lng: 36.8219 },
        media: [],
      });
    } catch (error: any) {
      console.error('Submit error:', error);

      // Better error handling to show specific validation errors
      let errorMessage = 'An error occurred. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Failed to submit report',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, media: files }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          }));
          toast({
            title: 'Location detected',
            description: 'Your current location has been set for this report.',
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: 'Location access denied',
            description:
              'Please enter the address manually or enable location access.',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
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
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter a short title for the issue"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Issue Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
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
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the water issue in detail..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Location/Address *</Label>
              <div className="flex space-x-2">
                <Input
                  id="address"
                  placeholder="Enter the location or address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Coordinates: {formData.coordinates.lat.toFixed(4)},{' '}
                {formData.coordinates.lng.toFixed(4)}
              </p>
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
                  <span className="text-primary hover:underline">
                    Click to upload
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    or drag and drop
                  </span>
                </Label>
                {formData.media.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formData.media.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Submitting Report...' : 'Submit Report'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
