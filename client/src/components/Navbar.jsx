import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Droplets,
  Menu,
  MapPin,
  Plus,
  BarChart3,
  Users,
  LogOut,
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const menuItems = [
    {
      id: 'map',
      label: 'Water Map',
      icon: MapPin,
      roles: ['citizen', 'verifier', 'technician', 'admin'],
    },
    {
      id: 'report',
      label: 'Report Issue',
      icon: Plus,
      roles: ['citizen', 'verifier', 'admin'],
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      roles: ['technician', 'admin'],
    },
    {
      id: 'verify',
      label: 'Verify Reports',
      icon: Users,
      roles: ['verifier', 'admin'],
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleItemClick = (pageId) => {
    onPageChange(pageId);
    setIsOpen(false);
  };

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => onPageChange('home')}
              className="flex items-center space-x-2 text-primary font-bold text-xl"
            >
              <Droplets className="h-8 w-8" />
              <span>Tuko Maji</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {filteredItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                onClick={() => handleItemClick(item.id)}
                className="flex items-center space-x-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Points Badge */}
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Award className="h-3 w-3" />
              <span>{user.points} pts</span>
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <Badge variant="outline" className="w-fit mt-1">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">
                  Mobile Navigation Menu
                </SheetTitle>
                <div className="flex flex-col space-y-4 mt-4">
                  {filteredItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? 'default' : 'ghost'}
                      onClick={() => handleItemClick(item.id)}
                      className="justify-start"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
