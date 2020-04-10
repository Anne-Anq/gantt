import React, { useState, useRef, useEffect } from 'react'
import { GanttChart } from './GanttChart'
import './style.css'

export const SearchValuesList = ({ values, updateEvents }) => {
  const [mounted, setMounted] = useState(false)
  const handleMoveEvents = newEventsData => updateEvents(newEventsData)
  // const handleBoundariesChange = boundaries =>
  //   console.log('new boundaries', boundaries)

  const ganttChart = useRef(
    new GanttChart({
      containerId: 'container',
      onMoveEvents: handleMoveEvents,
      // onBoundariesChange: handleBoundariesChange
      minEventDuration: 15
    })
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
