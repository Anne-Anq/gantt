import React, { useState, useRef, useEffect } from 'react'
import { min, max, addHours } from 'date-fns'
import {
  gaugeToSpacingMap,
  fullDateTimeFormat,
  gaugeToFormatMap
} from './utils'
import * as d3 from 'd3'
import { GanttChart } from './GanttChart'
import './style.css'

let transformEvent
const DEFAULT_EVENT_TITLE_WIDTH = 100
let titleWidth = DEFAULT_EVENT_TITLE_WIDTH

const minDate = values =>
  min(values.flatMap(({ events }) => events.map(event => event.startTime)))

const maxDate = values =>
  max(values.flatMap(({ events }) => events.map(event => event.endTime)))

const EVENT_RECT_HEIGHT = 20
const TIMELINE_HEIGHT = EVENT_RECT_HEIGHT
const LINE_PADDING = 5
const LINE_HEIGHT = EVENT_RECT_HEIGHT + 2 * LINE_PADDING
const PADDING_LEFT_TEXT = 28
const HANDLE_WIDTH = 10
const TIMELINE_TICK_SIZE = 5

const eventsHeight = eventNumber => eventNumber * LINE_HEIGHT
const totalHeight = eventNumber => eventsHeight(eventNumber)

const addBackgroundLine = gParentNode =>
  gParentNode
    .append('rect')
    .attr('height', LINE_HEIGHT)
    .attr('width', '100%') // removing this prevents rescale on window resize
    .attr(
      'class',
      (_d, i) => `eventLineBackground ${i % 2 === 0 ? 'evenLine' : 'oddLine'}`
    )

const getBackgroundLineWidth = () => {
  const eventLineBackground = d3.select('.eventLineBackground').node()
  return eventLineBackground ? eventLineBackground.getBBox().width : 0
}

const addTitleText = () =>
  d3
    .selectAll('.eventTitleSection')
    .append('g')
    .attr('clip-path', event => `url(#eventTitleClip_${event.id})`)
    .append('text')
    .text(event => event.title)
    .attr('class', 'eventTitleText')
    .attr('y', LINE_HEIGHT / 2)
    .attr('x', PADDING_LEFT_TEXT)

const getXScale = (values, eventScheduleWidth) => {
  const mindate = minDate(values)
  const maxdate = maxDate(values)
  const xScale = d3
    .scaleTime()
    .domain([mindate, maxdate])
    .range([0, eventScheduleWidth])
  return xScale
}

const createSections = (gParentNode, values) => {
  gParentNode
    .append('g')
    .attr('class', 'eventTitleSection')
    .attr('x', 0)
    .attr('y', 0)
    .append('defs')
    .append('clipPath')
    .attr('id', event => `eventTitleClip_${event.id}`)
    .attr('class', 'eventTitleClip')
    .append('rect')
    .attr('height', LINE_HEIGHT)

  gParentNode
    .append('rect')
    .attr('class', 'dragHandle')
    .attr('width', HANDLE_WIDTH)
    .attr('height', LINE_HEIGHT)
    .attr('y', 0)
    .attr('fill', 'purple')
    .call(
      d3.drag().on('drag', () => {
        titleWidth += d3.event.dx
        redraw(values)
      })
    )

  gParentNode
    .append('g')
    .attr('class', 'scheduleSection')
    .attr('y', 0)
    .append('defs')
    .append('clipPath')
    .attr('id', event => `scheduleClip_${event.id}`)
    .append('rect')
    .attr('height', LINE_HEIGHT)
    .attr('width', '100%') // if this is removed clip size does not adjust
}

const addScheduleRect = () => {
  d3.selectAll('.scheduleSection')
    .append('g')
    .attr('clip-path', event => `url(#scheduleClip_${event.id})`)
    .append('rect')
    .attr('y', LINE_PADDING)
    .attr('height', EVENT_RECT_HEIGHT)
    .attr('fill', event => event.style.bg)
    .attr('rx', 5)
    .attr('class', 'scheduleRect')
    .on('mouseout', () =>
      d3
        .select('#scheduleRectTooltip')
        .style('opacity', 0)
        .selectAll('div')
        .remove()
    )
    .on('mouseover', d => {
      const tooltip = d3.select('#scheduleRectTooltip')
      const detailEnter = tooltip
        .selectAll('div')
        .data(d.detailContent.map((content, index) => ({ ...content, index })))
        .enter()

      detailEnter
        .append('div')
        .text(content => content.label)
        .attr('class', 'detailLabel')
      detailEnter.append('div').text(content => content.value)
      tooltip.selectAll('div').sort((a, b) => a.index - b.index)
      tooltip
        .style('top', `${d3.event.pageY + 15}px`)
        .style(
          'left',
          `${
            d3.event.pageX - 15 + tooltip.node().clientWidth <
            d3.select('#container').node().clientWidth
              ? d3.event.pageX - 15
              : d3.select('#container').node().clientWidth -
                tooltip.node().clientWidth
          }px`
        )
        .style('opacity', 1)
    })
}

const redrawScheduleRect = xScale => {
  d3.selectAll('.scheduleRect')
    .attr('x', event => xScale(event.startTime))
    .attr('width', event => xScale(event.endTime) - xScale(event.startTime))
}

const getTimeScaleGauge = xScale => {
  const date1 = new Date()
  const date2 = addHours(date1, 1)
  return xScale(date2) - xScale(date1)
}

const getTicksSpacing = xScale => {
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

const getTicksFormat = (xScale, x) => {
  const gauge = getTimeScaleGauge(xScale)
  let ticksFormat
  for (const { maxGauge, format } of gaugeToFormatMap(x)) {
    if (gauge < maxGauge) {
      return (ticksFormat = format)
    }
  }
  return ticksFormat
}

const getXAxis = (xScale, maxHeight) => {
  return d3
    .axisBottom(xScale)
    .ticks(getTicksSpacing(xScale))
    .tickSize(-maxHeight)
}

const getTimeline = xScale =>
  d3
    .axisTop(xScale)
    .ticks(getTicksSpacing(xScale))
    .tickSize(TIMELINE_TICK_SIZE)
    .tickFormat(x => getTicksFormat(xScale, x))

const buildAxes = () => {
  d3.selectAll('.eventsSvg')
    .append('g')
    .attr('class', 'line-chart-xaxis')
}

const drawAxes = (xScale, maxHeight) => {
  const xAxis = getXAxis(xScale, maxHeight)
  const timeline = getTimeline(xScale)
  d3.selectAll('.line-chart-xaxis').call(xAxis)

  d3.select('#time').call(timeline)

  d3.selectAll('#time g.tick')
    .append('circle')
    .attr('fill', 'transparent')
    .attr('r', 15)
    .attr('y', -TIMELINE_HEIGHT)
    .on('mouseout', () => d3.select('#dateTooltip').style('opacity', 0))
    .on('mouseover', d => {
      d3.select('#dateTooltip')
        .text(fullDateTimeFormat(d))
        .style('top', `${d3.event.pageY + 15}px`)
        .style('left', `${d3.event.pageX - 15}px`)
        .style('opacity', 1)
    })
}

const redraw = values => {
  const maxHeight = getMaxHeight(values)
  const entireLineWidth = getBackgroundLineWidth()
  const eventScheduleWidth = entireLineWidth - titleWidth
  let xScale = getXScale(values, eventScheduleWidth)
  if (d3.event && d3.event.transform) {
    transformEvent = d3.event.transform
  }
  if (transformEvent) {
    xScale = transformEvent.rescaleX(xScale)
  }
  redrawScheduleRect(xScale)
  drawAxes(xScale, maxHeight)
  // move handle
  d3.selectAll('.dragHandle').attr('x', titleWidth - HANDLE_WIDTH)
  d3.selectAll('.eventTitleClip rect').attr('width', titleWidth - HANDLE_WIDTH)
  d3.selectAll('.scheduleSection').attr(
    'transform',
    `translate(${titleWidth},0)`
  )
  d3.selectAll('.line-chart-xaxis').attr(
    'transform',
    d => `translate(${titleWidth},${eventsHeight(d.events.length)})`
  )
  d3.select('#time').attr(
    'transform',
    `translate(${titleWidth},${TIMELINE_HEIGHT})`
  )
}

const getMaxHeight = values =>
  totalHeight(Math.max(...values.map(value => value.events.length)))

export const SearchValuesListForRefOnly = ({ values }) => {
  const eventLine = ''

  addBackgroundLine(eventLine)

  createSections(eventLine, values)
  addTitleText(eventLine)
  // createDraggableHandle(eventLine)
  addScheduleRect(eventLine)
  buildAxes()
  redraw(values)
  window.addEventListener('resize', () => redraw(values))
  // const zoom = d3
  //   .zoom()
  //   .scaleExtent([0.006, 6])
  //   .on('zoom', () => redraw(values))
  // eventsSvg.call(zoom)
  return <div id="container"></div>
}

export const SearchValuesList = ({ values }) => {
  const [mounted, setMounted] = useState(false)

  const ganttChart = useRef(new GanttChart('container'))
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
