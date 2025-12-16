import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Example API call to backend
    const fetchMessage = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/hello`)
        const data = await response.json()
        setMessage(data.message)
      } catch (error) {
        setMessage('Welcome to Tampa Mixtape!')
      } finally {
        setLoading(false)
      }
    }
    fetchMessage()
  }, [])

  return (
    <div className="app">
      <h1>Tampa Mixtape</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <p>{message}</p>
      )}
    </div>
  )
}

export default App
