import React, { useState, useRef, useEffect } from 'react'
import { GanttChart } from './GanttChart'
import './style.css'

export const SearchValuesList = ({ values }) => {
  const [mounted, setMounted] = useState(false)
  const handleMoveEvents = events => console.log('new events data', events)

  const ganttChart = useRef(
    new GanttChart({ containerId: 'container', onMoveEvents: handleMoveEvents })
  )
  const { draw } = ganttChart.current

  useEffect(() => {
    if (mounted) {
      draw(values)
    }
  }, [mounted, draw, values])

  useEffect(() => {
    if (!mounted) {
      setMounted(true)
    }
  }, [mounted, setMounted])

  return <div id="container" />
}
