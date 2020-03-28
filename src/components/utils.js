import * as d3 from 'd3'

export const gaugeToSpacingMap = [
  { maxGauge: 4, unit: 'hour', spacing: 12 },
  { maxGauge: 20, unit: 'hour', spacing: 6 },
  { maxGauge: 30, unit: 'hour', spacing: 2 },
  { maxGauge: 60, unit: 'hour', spacing: 1 },
  { maxGauge: 120, unit: 'minute', spacing: 30 },
  { maxGauge: 420, unit: 'minute', spacing: 15 },
  { maxGauge: Infinity, unit: 'minute', spacing: 5 }
]

export const isEveryXHours = (timestamp, hoursSeparation) =>
  Number(d3.timeFormat('%H')(timestamp)) % hoursSeparation === 0

export const isEveryXMinute = (timestamp, minutesSeparation) =>
  Number(d3.timeFormat('%M')(timestamp)) % minutesSeparation === 0

export const isAtNoon = x => d3.timeFormat('%H')(x) === '12'

export const HourMinuteFormat = x => d3.timeFormat('%H:%M')(x)

export const dateFormat = x => d3.timeFormat('%d %b %y')(x)

export const dateSuffix = x => {
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
export const fullDateTimeFormat = x =>
  d3.timeFormat(`%a %B %d${dateSuffix(x)} %Y at %H:%M`)(x)

export const isEveryOtherDay = x => Number(d3.timeFormat('%d')(x)) % 2 === 0

export const every6hoursFormat = x =>
  isEveryXHours(x, 6) ? HourMinuteFormat(x) : ''
