import React from 'react'
import { uniqBy } from 'lodash'
import {
  FormControl,
  InputAdornment,
  OutlinedInput,
  makeStyles,
  Chip
} from '@material-ui/core'
import { Search } from '@material-ui/icons'

const useStyles = makeStyles(theme => ({
  formcontrol: {
    padding: theme.spacing(1),
    width: '-webkit-fill-available'
  },
  wrapper: { width: '100vw', overflowY: 'scroll' }
}))

export const SearchBar = ({ data, children }) => {
  const classes = useStyles()
  const [confirmedValues, setConfirmedValues] = React.useState([])
  const [ongoingValue, setOngoingValue] = React.useState('')

  const filteredData = [...confirmedValues, ongoingValue]
    .filter(Boolean)
    .flatMap(value =>
      data.flatMap(event =>
        event.lookupTags
          .filter(tag => tag.toLowerCase().includes(value.toLowerCase()))
          .map(tag => ({
            searchValue: tag,
            events: data.filter(event => event.lookupTags.includes(tag))
          }))
      )
    )
  const sortedAndUniqData = uniqBy(
    filteredData,
    data => data.searchValue
  ).sort((A, B) =>
    A.searchValue.toLowerCase() > B.searchValue.toLowerCase() ? 1 : -1
  )

  return (
    <div className={classes.wrapper}>
      <FormControl className={classes.formcontrol} variant="outlined" fullWidth>
        <OutlinedInput
          id="search-bar"
          type="text"
          value={ongoingValue}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              setConfirmedValues([...confirmedValues, ongoingValue])
              setOngoingValue('')
            }
            if (event.key === 'Backspace' && ongoingValue === '') {
              setConfirmedValues(
                confirmedValues.slice(0, confirmedValues.length - 1)
              )
            }
          }}
          onChange={event => {
            setOngoingValue(event.target.value)
          }}
          startAdornment={
            <InputAdornment position="start">
              {confirmedValues.map((confirmedValue, index) => (
                <Chip
                  key={index}
                  label={confirmedValue}
                  onDelete={() => {
                    const before = confirmedValues.slice(0, index)
                    const after = confirmedValues.slice(
                      index + 1,
                      confirmedValues.length
                    )
                    setConfirmedValues([...before, ...after])
                  }}
                />
              ))}
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <Search />
            </InputAdornment>
          }
        />
      </FormControl>
      {children(sortedAndUniqData)}
    </div>
  )
}
