import React, { useState, useRef, useEffect } from 'react'
import { SearchBar } from './components/SearchBar'
import { SearchValuesList } from './components/SearchValuesList'
import { mockData } from './mockData.js'

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

  return (
    <>
      <SearchBar data={events}>
        {values => (
          <SearchValuesList values={values} updateEvents={updateEvents} />
        )}
      </SearchBar>
    </>
  )
}
