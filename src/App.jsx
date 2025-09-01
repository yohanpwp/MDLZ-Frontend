import { useState } from 'react'
import PropTypes from 'prop-types'
import Button from './components/ui/Button'
import ThemeToggle from './components/ui/ThemeToggle'
import LanguageSwitcher from './components/ui/LanguageSwitcher'
import ErrorBoundary from './components/error/ErrorBoundary'
import OfflineIndicator from './components/ui/OfflineIndicator'
import ErrorHandlingDemo from './components/examples/ErrorHandlingDemo'
import InternationalizationDemo from './components/examples/InternationalizationDemo'
import DataServiceDemo from './components/examples/DataServiceDemo'
import { useOfflineStorage } from './hooks/useOfflineStorage'
import { useTheme } from './contexts/ThemeContext'
import { useLanguage } from './contexts/LanguageContext'
import { useFormatters } from './hooks/useFormatters'

function App() {
  const [count, setCount] = useState(0)
  const [showDemo, setShowDemo] = useState(false)
  const [showI18nDemo, setShowI18nDemo] = useState(false)
  const [showDataDemo, setShowDataDemo] = useState(false)
  const { isOnline, pendingSync } = useOfflineStorage('app_data', {})
  const { theme, effectiveTheme } = useTheme()
  const { t } = useLanguage()
  const { formatPrice, formatShortDateTime, formatInteger } = useFormatters()

  // Demo data for formatting
  const demoAmount = 1234.56
  const demoDate = new Date()

  if (showDemo) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <OfflineIndicator 
            pendingSync={pendingSync}
            className="fixed top-4 right-4 z-50"
          />
          <div className="container mx-auto py-8">
            <div className="mb-4">
              <Button 
                onClick={() => setShowDemo(false)}
                variant="outline"
              >
                ← {t('common.back')}
              </Button>
            </div>
            <ErrorHandlingDemo />
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  if (showI18nDemo) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <OfflineIndicator 
            pendingSync={pendingSync}
            className="fixed top-4 right-4 z-50"
          />
          <div className="container mx-auto py-8">
            <div className="mb-4">
              <Button 
                onClick={() => setShowI18nDemo(false)}
                variant="outline"
              >
                ← {t('common.back')}
              </Button>
            </div>
            <InternationalizationDemo />
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  if (showDataDemo) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <OfflineIndicator 
            pendingSync={pendingSync}
            className="fixed top-4 right-4 z-50"
          />
          <div className="container mx-auto py-8">
            <div className="mb-4">
              <Button 
                onClick={() => setShowDataDemo(false)}
                variant="outline"
              >
                ← {t('common.back')}
              </Button>
            </div>
            <DataServiceDemo />
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center transition-colors duration-300">
        {/* Offline indicator */}
        <OfflineIndicator 
          pendingSync={pendingSync}
          className="fixed top-4 right-4 z-50"
        />
        
        {/* Theme toggle and language switcher in top left */}
        <div className="fixed top-4 left-4 z-50 flex items-center space-x-2">
          <ThemeToggle showLabel={true} variant="outline" />
          <LanguageSwitcher variant="outline" />
        </div>
        
        <div className="max-w-md mx-auto bg-card rounded-lg shadow-md p-6 border border-border">
          <h1 className="text-3xl font-bold text-card-foreground mb-4">{t('invoice.title')}</h1>
          <p className="text-muted-foreground mb-4">{t('invoice.title')} - {t('common.loading')}</p>
          <div className="space-y-2">
            <Button onClick={() => setCount(count + 1)}>
              {t('common.add')}: {formatInteger(count)}
            </Button>
            <Button variant="outline">
              {t('common.edit')}
            </Button>
            <Button variant="secondary" size="sm">
              {t('common.save')}
            </Button>
            <Button 
              onClick={() => setShowDemo(true)}
              className="w-full"
            >
              {t('common.error')} Demo
            </Button>
            <Button 
              onClick={() => setShowI18nDemo(true)}
              className="w-full"
              variant="secondary"
            >
              {t('language.selectLanguage')} Demo
            </Button>
            <Button 
              onClick={() => setShowDataDemo(true)}
              className="w-full"
              variant="outline"
            >
              Data Service Demo
            </Button>
          </div>
          
          {/* Connection status */}
          <div className="mt-4 text-sm text-muted-foreground">
            {t('common.status')}: {isOnline ? t('common.online') : t('offline.title')}
            {pendingSync > 0 && ` • ${t('offline.pendingSync', { count: pendingSync })}`}
          </div>

          {/* Theme status */}
          <div className="mt-2 text-sm text-muted-foreground">
            {t('theme.appearance')}: {theme === 'system' ? `${t('theme.system')} (${effectiveTheme})` : t(`theme.${theme}`)}
          </div>

          {/* Formatting examples */}
          <div className="mt-2 text-sm text-muted-foreground">
            {t('invoice.amount')}: {formatPrice(demoAmount)} • {formatShortDateTime(demoDate)}
          </div>
          
          {/* Features list */}
          <div className="mt-6 p-4 bg-accent rounded-lg">
            <h3 className="font-semibold text-accent-foreground mb-2">Enhanced Features:</h3>
            <ul className="text-sm text-accent-foreground space-y-1">
              <li>• Global Error Boundary</li>
              <li>• User-friendly Error Messages</li>
              <li>• Loading States & Progress Indicators</li>
              <li>• Form Validation with Real-time Feedback</li>
              <li>• Offline Capability & Data Persistence</li>
              <li>• Light/Dark Theme Toggle with System Detection</li>
            </ul>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

App.propTypes = {
  // Add prop types here as props are added to the component
}

export default App