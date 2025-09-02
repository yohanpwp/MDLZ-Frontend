import { useState } from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Upload,
  Download,
  Users,
  Package,
  FileText,
  CreditCard,
  BarChart3,
  UserCog,
  FileCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../utils/cn";
import Tooltip from "../ui/Tooltip";
import { useLanguage } from "../../contexts/LanguageContext";

const Sidebar = ({ isOpen, onClose, isCollapsed, className }) => {
  const [expandedSections, setExpandedSections] = useState({
    masterData: false,
    components: false,
  });
  const { t } = useLanguage();

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const navigationItems = [
    {
      title: t("navigation.dashboard"),
      icon: LayoutDashboard,
      path: "/",
      exact: true,
    },
    {
      title: t("navigation.masterData"),
      icon: Database,
      isSection: true,
      key: "masterData",
      children: [
        {
          title: t("navigation.importData"),
          icon: Upload,
          path: "/master-data/import",
        },
        {
          title: t("navigation.exportData"),
          icon: Download,
          path: "/master-data/export",
        },
      ],
    },
    {
      title: t("navigation.references"),
      icon: Package,
      isSection: true,
      key: "references",
      children: [
        {
          title: t("navigation.customers"),
          icon: Users,
          path: "/references/customers",
        },
        {
          title: t("navigation.products"),
          icon: Package,
          path: "/references/products",
        },
      ],
    },
    {
      title: t("navigation.transactions"),
      icon: Package,
      isSection: true,
      key: "transactions",
      children: [
        {
          title: t("navigation.invoices"),
          icon: FileText,
          path: "/transactions/invoices",
        },
        {
          title: t("navigation.creditNotes"),
          icon: CreditCard,
          path: "/transactions/credit-notes",
        },
      ],
    },
    {
      title: t("navigation.reports"),
      icon: BarChart3,
      path: "/components/reports",
    },
    {
      title: t("navigation.userManagement"),
      icon: UserCog,
      path: "/roles/user-management",
    },
  ];

  const NavItem = ({ item, isChild = false }) => {
    if (item.isSection) {
      const isExpanded = expandedSections[item.key];

      // In collapsed mode, don't show section headers
      if (isCollapsed) {
        return (
          <div className="space-y-1">
            {item.children.map((child) => (
              <NavItem key={child.path} item={child} isChild={false} />
            ))}
          </div>
        );
      }

      return (
        <div>
          <button
            onClick={() => toggleSection(item.key)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              "transition-colors duration-200"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </>
            )}
          </button>
          {isExpanded && !isCollapsed && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => (
                <NavItem key={child.path} item={child} isChild={true} />
              ))}
            </div>
          )}
        </div>
      );
    }

    const navLink = (
      <NavLink
        to={item.path}
        end={item.exact}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md",
            "transition-colors duration-200",
            isChild && !isCollapsed && "ml-4",
            isCollapsed && "justify-center",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )
        }
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </NavLink>
    );

    return isCollapsed ? (
      <Tooltip content={item.title} side="right">
        {navLink}
      </Tooltip>
    ) : (
      navLink
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-card border-r border-border",
          "transform transition-all duration-300 ease-in-out",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div
            className={cn("p-4 border-b border-border", isCollapsed && "px-2")}
          >
            <div
              className={cn(
                "flex items-center gap-3",
                isCollapsed && "justify-center"
              )}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  MD
                </span>
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="font-semibold text-sm">MLDZ - </h2>
                  <p className="text-xs text-muted-foreground">Frontend</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              "flex-1 p-4 space-y-2 overflow-y-auto",
              isCollapsed && "px-2"
            )}
          >
            {navigationItems.map((item) => (
              <NavItem key={item.path || item.key} item={item} />
            ))}
          </nav>

          {/* Sidebar footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                2025 @Verismart
                <NavLink to="/settings/terms-conditions">
                  {" "}
                  Terms & Conditions
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool,
  className: PropTypes.string,
};

export default Sidebar;
