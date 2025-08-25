import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '../../utils/cn';

const Layout = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when screen size changes
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      // Reset collapsed state on mobile
      if (mobile) {
        setSidebarCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <Header 
        onMenuToggle={toggleSidebar}
        onSidebarToggle={toggleSidebarCollapse}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen || !isMobile} 
          onClose={closeSidebar}
          isCollapsed={!isMobile && sidebarCollapsed}
        />
        
        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-auto",
          "transition-all duration-300 ease-in-out"
        )}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Layout;