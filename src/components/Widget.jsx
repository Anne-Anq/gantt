import React, { useState, useRef, useEffect } from 'react'
import { SearchBar } from './SearchBar'
import { GanttComponent } from './GanttChart/GanttComponent'
import { mockData } from '../mockData.js'

export const Widget = () => {
  const [events, setEvents] = useState(mockData)
  const eventsRef = useRef(events)

  const updateEvents = newData => {
    const val = eventsRef.current.map(event => {
      if (!newData[event.id]) return event
      return { ...event, ...newData[event.id] }
    })
    setEvents(val)
  }

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  const onMoveEvents = newEventsData => updateEvents(newEventsData)
  const onBoundariesChange = boundaries =>
    console.log('new boundaries', boundaries)

  return (
    <SearchBar data={events}>
      {values => (
        <GanttComponent
          values={values}
          onMoveEvents={onMoveEvents}
          onBoundariesChange={onBoundariesChange}
        />
      )}
    </SearchBar>
  )
}
