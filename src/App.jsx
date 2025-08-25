import { useState } from 'react'
import PropTypes from 'prop-types'
import Button from './components/ui/Button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Invoice Validation System</h1>
        <p className="text-gray-600 mb-4">Welcome to the Invoice Validation System</p>
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
        </div>
      </div>
    </div>
  )
}

App.propTypes = {
  // Add prop types here as props are added to the component
}

export default App