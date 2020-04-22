import * as d3 from 'd3'
import { addHours } from 'date-fns'

export const getTicksSpacing = xScale => {
  const gauge = getTimeScaleGauge(xScale)
  let ticksSpacing

  for (const { maxGauge, unit, spacing } of gaugeToSpacingMap) {
    if (gauge < maxGauge) {
      return (ticksSpacing =
        unit === 'hour'
          ? d3.timeHour.every(spacing)
          : d3.timeMinute.every(spacing))
    }
  }
  return ticksSpacing
}

export const getTicksFormat = (xScale, x) => {
  const gauge = getTimeScaleGauge(xScale)
  let ticksFormat
  for (const { maxGauge, format } of gaugeToFormatMap(x)) {
    if (gauge < maxGauge) {
      return (ticksFormat = format)
    }
  }
  return ticksFormat
}

const gaugeToFormatMap = x => [
  {
    maxGauge: 2.5,
    format: isEveryOtherDay(x) && isAtNoon(x) ? dateFormat(x) : ''
  },
  { maxGauge: 5, format: isAtNoon(x) ? dateFormat(x) : '' },
  { maxGauge: 30, format: isAtNoon(x) ? dateFormat(x) : every6hoursFormat(x) },
  { maxGauge: 60, format: isEveryXHours(x, 2) ? HourMinuteFormat(x) : '' },
  { maxGauge: 120, format: isEveryXHours(x, 1) ? HourMinuteFormat(x) : '' },
  { maxGauge: 420, format: isEveryXMinute(x, 30) ? HourMinuteFormat(x) : '' },
  { maxGauge: Infinity, format: HourMinuteFormat(x) }
]

const gaugeToSpacingMap = [
  { maxGauge: 4, unit: 'hour', spacing: 12 },
  { maxGauge: 20, unit: 'hour', spacing: 6 },
  { maxGauge: 30, unit: 'hour', spacing: 2 },
  { maxGauge: 60, unit: 'hour', spacing: 1 },
  { maxGauge: 120, unit: 'minute', spacing: 30 },
  { maxGauge: 420, unit: 'minute', spacing: 15 },
  { maxGauge: Infinity, unit: 'minute', spacing: 5 }
]

export const fullDateTimeFormat = x =>
  d3.timeFormat(`%a %B %d${dateSuffix(x)} %Y at %H:%M`)(x)

const getTimeScaleGauge = xScale => {
  const date1 = new Date()
  const date2 = addHours(date1, 1)
  return xScale(date2) - xScale(date1)
}

const isEveryXHours = (timestamp, hoursSeparation) =>
  Number(d3.timeFormat('%H')(timestamp)) % hoursSeparation === 0

const isEveryXMinute = (timestamp, minutesSeparation) =>
  Number(d3.timeFormat('%M')(timestamp)) % minutesSeparation === 0

const isAtNoon = x => d3.timeFormat('%H')(x) === '12'

const HourMinuteFormat = x => d3.timeFormat('%H:%M')(x)

const dateFormat = x => d3.timeFormat('%d %b %y')(x)

const dateSuffix = x => {
  const dateString = d3.timeFormat('%d')(x)
  switch (dateString.slice(dateString.length - 1)) {
    case '1': {
      return 'st'
    }
    case '2': {
      return 'nd'
    }
    case '3': {
      return 'rd'
    }
    default: {
      return 'th'
    }
  }
}

const isEveryOtherDay = x => Number(d3.timeFormat('%d')(x)) % 2 === 0

const every6hoursFormat = x => (isEveryXHours(x, 6) ? HourMinuteFormat(x) : '')
