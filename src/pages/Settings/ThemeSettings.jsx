import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const ThemeSettings = () => {
  const { theme, effectiveTheme, setTheme, THEME_OPTIONS } = useTheme();

  const themeOptions = [
    {
      value: THEME_OPTIONS.LIGHT,
      label: 'Light',
      description: 'Clean and bright interface',
      icon: Sun,
    },
    {
      value: THEME_OPTIONS.DARK,
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: Moon,
    },
    {
      value: THEME_OPTIONS.SYSTEM,
      label: 'System',
      description: 'Follows your device preference',
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Theme Preferences
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Choose how the interface looks and feels. Your preference will be saved automatically.
        </p>
      </div>

      <div className="grid gap-4">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          const isEffective = effectiveTheme === option.value || 
            (theme === THEME_OPTIONS.SYSTEM && effectiveTheme === option.value);

          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "relative flex items-center p-4 rounded-lg border-2 transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-200 dark:border-gray-700"
              )}
            >
              <div className="flex items-center flex-1">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full mr-4",
                  isSelected 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "font-medium",
                      isSelected 
                        ? "text-blue-900 dark:text-blue-100"
                        : "text-gray-900 dark:text-gray-100"
                    )}>
                      {option.label}
                    </h3>
                    {option.value === THEME_OPTIONS.SYSTEM && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        Currently: {effectiveTheme}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm",
                    isSelected 
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {option.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          About Theme Settings
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Your theme preference is saved locally and will persist across sessions</li>
          <li>• System theme automatically switches based on your device's dark/light mode setting</li>
          <li>• Theme changes apply instantly with smooth transitions</li>
          <li>• All interface elements respect your theme choice for consistent experience</li>
        </ul>
      </div>
    </div>
  );
};

export default ThemeSettings;