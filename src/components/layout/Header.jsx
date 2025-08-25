import { useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, User, Bell, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

const Header = ({ onMenuToggle, onSidebarToggle, sidebarCollapsed, className }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mock user data - will be replaced with Redux state later
  const user = {
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Financial Administrator'
  };

  return (
    <header className={cn(
      "bg-slate-800 border-b border-slate-700 shadow-lg",
      "flex items-center justify-between px-4 py-3",
      "min-h-[64px]",
      className
    )}>
      {/* Left section - Menu toggle and branding */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden text-white hover:bg-slate-700"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="hidden lg:flex text-white hover:bg-slate-700"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IV</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-white">
              Invoice Validation System
            </h1>
          </div>
        </div>
      </div>

      {/* Right section - User info and actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-slate-700">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 text-white hover:bg-slate-700"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-slate-300">{user.role}</div>
            </div>
          </Button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-50">
              <div className="p-3 border-b border-slate-200">
                <div className="font-medium text-sm text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-600">{user.email}</div>
                <div className="text-xs text-slate-600">{user.role}</div>
              </div>
              <div className="p-1">
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-slate-700 hover:bg-slate-100">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm text-slate-700 hover:bg-slate-100">
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  onMenuToggle: PropTypes.func,
  onSidebarToggle: PropTypes.func,
  sidebarCollapsed: PropTypes.bool,
  className: PropTypes.string,
};

export default Header;