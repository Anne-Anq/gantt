import React, { useState, useRef, useEffect } from 'react'
import { GanttChart } from './GanttChart'
import './style.css'

export const GanttComponent = ({
  values,
  onMoveEvents,
  onBoundariesChange
}) => {
  const [mounted, setMounted] = useState(false)

  const ganttChart = useRef(
    new GanttChart({
      containerId: 'container',
      onMoveEvents,
      onBoundariesChange,
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
