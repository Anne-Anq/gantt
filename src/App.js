import React from 'react'
import './App.css'
import { mockData } from './mockData.js'
import { Widget } from './Widget.jsx'

function App() {
  return (
    <div className="App">
      <Widget events={mockData} />
    </div>
  )
}

export default App
