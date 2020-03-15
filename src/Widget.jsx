import React from 'react'
import { SearchBar } from './components/SearchBar'
import { SearchValuesList } from './components/SearchValuesList'

export const Widget = ({ events }) => {
  return (
    <>
      <SearchBar data={events}>
        {values => <SearchValuesList values={values} />}
      </SearchBar>
    </>
  )
}
