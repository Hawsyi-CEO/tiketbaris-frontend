import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

console.log('Main.jsx loading...')

try {
  const root = document.getElementById('root')
  console.log('Root element found:', root)
  
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('App rendered successfully')
} catch (error) {
  console.error('Error rendering app:', error)
  document.body.innerHTML = `<pre>Error: ${error.message}\n${error.stack}</pre>`
}
