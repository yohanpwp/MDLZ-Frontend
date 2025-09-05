import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Settings, ChevronDown, Palette } from "lucide-react";
import {
  logoutUser,
  selectUser,
  selectIsLoading,
} from "../../redux/slices/authSlice.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import ThemeToggle from "../ui/ThemeToggle.jsx";
import LoadingSpinner from "../ui/LoadingSpinner.jsx";

/**
 * UserMenu Component
 *
 * Displays user information and provides logout functionality
 * for the Invoice Validation System.
 */
const UserMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const { theme, effectiveTheme, THEME_OPTIONS } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force navigation even if logout fails
      navigate("/login");
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action) => {
    setIsOpen(false);
    action();
  };

  if (!user) {
    return null;
  }

  const userDisplayName = `${user.firstname || 'M'} ${user.lastname || ''}`;
  const userInitials = `${user.firstname?.charAt(0) || 'M'}${user.lastname?.charAt(
    0
  ) || 'D'}`.toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Trigger */}
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-white hover:text-gray-100 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {userInitials}
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-white">
            {userDisplayName}
          </div>
          <div className="text-xs text-slate-300 capitalize">
            {user.role.replace("_", " ")}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {userInitials}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {userDisplayName}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400 capitalize">
                    {user.role.replace("_", " ")}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => handleMenuItemClick(() => navigate("/profile"))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <User className="w-4 h-4 mr-3" />
                Profile Settings
              </button>

              <button
                onClick={() => handleMenuItemClick(() => navigate("/settings"))}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Settings className="w-4 h-4 mr-3" />
                Preferences
              </button>
            </div>

            {/* Theme Section */}
            <div className="py-1 border-t border-gray-100">
              <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Palette className="w-4 h-4 mr-3 text-gray-500" />
                    <span className="text-sm text-gray-700">Theme</span>
                  </div>
                  <ThemeToggle
                    showLabel={true}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  />
                </div>
                <div className="mt-1 ml-7 text-xs text-gray-500">
                  Current:{" "}
                  {theme === THEME_OPTIONS.SYSTEM
                    ? `System (${effectiveTheme})`
                    : theme}
                </div>
              </div>
            </div>

            {/* Logout Section */}
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={() => handleMenuItemClick(handleLogout)}
                disabled={isLoading}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-3" text="" />
                ) : (
                  <LogOut className="w-4 h-4 mr-3" />
                )}
                {isLoading ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
