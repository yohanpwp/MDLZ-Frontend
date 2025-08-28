import { useState } from 'react'
import PropTypes from 'prop-types'
import Button from './components/ui/Button'
import ErrorBoundary from './components/error/ErrorBoundary'
import OfflineIndicator from './components/ui/OfflineIndicator'
import ErrorHandlingDemo from './components/examples/ErrorHandlingDemo'
import { useOfflineStorage } from './hooks/useOfflineStorage'

function App() {
  const [count, setCount] = useState(0)
  const [showDemo, setShowDemo] = useState(false)
  const { isOnline, pendingSync } = useOfflineStorage('app_data', {})

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
                ← Back to Main
              </Button>
            </div>
            <ErrorHandlingDemo />
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {/* Offline indicator */}
        <OfflineIndicator 
          pendingSync={pendingSync}
          className="fixed top-4 right-4 z-50"
        />
        
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Invoice Validation System</h1>
          <p className="text-gray-600 mb-4">Welcome to the Invoice Validation System with Enhanced Error Handling</p>
          <div className="space-y-2">
            <Button onClick={() => setCount(count + 1)}>
              Count: {count}
            </Button>
            <Button variant="outline">
              Outline Button
            </Button>
            <Button variant="secondary" size="sm">
              Secondary Small
            </Button>
            <Button 
              onClick={() => setShowDemo(true)}
              className="w-full"
            >
              View Error Handling Demo
            </Button>
          </div>
          
          {/* Connection status */}
          <div className="mt-4 text-sm text-gray-500">
            Status: {isOnline ? 'Online' : 'Offline'}
            {pendingSync > 0 && ` • ${pendingSync} pending sync operations`}
          </div>
          
          {/* Features list */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Error Handling Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Global Error Boundary</li>
              <li>• User-friendly Error Messages</li>
              <li>• Loading States & Progress Indicators</li>
              <li>• Form Validation with Real-time Feedback</li>
              <li>• Offline Capability & Data Persistence</li>
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