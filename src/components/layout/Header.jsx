import PropTypes from 'prop-types';
import { Menu, Bell, PanelLeftClose, PanelLeft } from 'lucide-react';
import Button from '../ui/Button';
import UserMenu from '../auth/UserMenu.jsx';
import { cn } from '../../utils/cn';

const Header = ({ onMenuToggle, onSidebarToggle, sidebarCollapsed, className }) => {

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
            <span className="text-white font-bold text-sm">MD</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-white">
              MLDZ - Frontend
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
        <UserMenu />
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