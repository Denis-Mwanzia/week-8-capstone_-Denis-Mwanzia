import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Droplets, Users, BarChart3 } from "lucide-react";
import heroImage from "@/assets/hero-water.jpg";
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Navbar } from '@/components/Navbar';
import { ReportForm } from '@/components/reports/ReportForm';
import { WaterMap } from '@/components/map/WaterMap';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard';
import { VerificationHub } from '@/components/verification/VerificationHub';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [currentPage, setCurrentPage] = useState('home');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Droplets className="h-8 w-8 text-primary animate-pulse" />
          <span className="text-lg">Loading Tuko Maji...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? 
      <LoginForm onSwitchToRegister={() => setAuthMode('register')} /> :
      <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'map':
        return <WaterMap />;
      case 'report':
        return <ReportForm />;
      case 'dashboard':
        return user.role === 'admin' ? <AdminDashboard /> : <TechnicianDashboard />;
      case 'verify':
        return <VerificationHub />;
      default:
        return <LandingContent onPageChange={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderCurrentPage()}
    </div>
  );
};

const LandingContent = ({ onPageChange }) => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Water management in Nairobi" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>
        
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Tuko Maji
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Empowering Nairobi residents to report, track, and resolve water issues together
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => onPageChange('report')}
            >
              Report Water Issue
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              onClick={() => onPageChange('map')}
            >
              View Water Map
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Tuko Maji Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A community-driven platform to improve water access and reduce wastage in Nairobi
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Report Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Take photos of leakages, burst pipes, or water shortages and pin them on the map
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Droplets className="h-12 w-12 text-accent mx-auto mb-4" />
                <CardTitle>Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Follow the status of reported issues from submission to resolution
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Community Action</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upvote issues, verify reports, and work together for faster solutions
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-accent mx-auto mb-4" />
                <CardTitle>Data Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Help authorities make data-driven decisions for better water management
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="bg-muted py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Together for Clean Water Access
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Supporting UN SDG 6: Clean Water & Sanitation for all Nairobi residents
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Issues Reported</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">85%</div>
              <p className="text-muted-foreground">Resolution Rate</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">Communities Served</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;