import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import ThemeToggle from "../components/ui/ThemeToggle";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import Button from "../components/ui/Button";

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header with theme and language controls */}
      <header className="absolute top-0 right-0 p-6 flex items-center gap-3">
        <ThemeToggle variant="ghost" />
        <LanguageSwitcher variant="ghost" size="sm" />
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-muted-foreground/20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-16 h-16 text-muted-foreground/40" />
            </div>
          </div>
        </div>

        {/* Error message */}
        <div className="max-w-md space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("errors.notFound") || "Page Not Found"}
          </h1>
          <p className="text-lg text-muted-foreground">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button asChild className="flex-1">
            <Link to="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              {t("navigation.dashboard") || "Dashboard"}
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back") || "Go Back"}
          </Button>
        </div>

        {/* Additional help text */}
        <div className="mt-8 text-sm text-muted-foreground">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>Invoice Validation System v1.0</p>
      </footer>
    </div>
  );
};

export default NotFound;
