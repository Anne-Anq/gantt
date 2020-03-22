import React from 'react'
import { min, max } from 'date-fns'
import * as d3 from 'd3'
import './style.css'

const minDate = values =>
  min(values.flatMap(({ events }) => events.map(event => event.startTime)))

const maxDate = values =>
  max(values.flatMap(({ events }) => events.map(event => event.endTime)))

const EVENT_RECT_HEIGHT = 20
const TIMELINE_HEIGHT = EVENT_RECT_HEIGHT
const LINE_PADDING = 5
const LINE_HEIGHT = EVENT_RECT_HEIGHT + 2 * LINE_PADDING
const PADDING_LEFT_TEXT = 28
const CHAR_WIDTH = 10
const eventsHeight = eventNumber => eventNumber * LINE_HEIGHT
const totalHeight = eventNumber => eventsHeight(eventNumber)
const getEventsTitleWidth = values =>
  Math.max(
    ...values.flatMap(({ events }) => events.map(event => event.title.length))
  ) * CHAR_WIDTH

const createSearchValueDivs = values => {
  // add a div searchValueDiv for each searchvalue
  const allValues = d3
    .select('#main')
    .selectAll('div')
    .data(values, d => d.searchValue)
  allValues.exit().remove()
  return allValues
    .enter()
    .append('div')
    .attr('class', 'searchValueDiv')
    .merge(allValues)
}

const addTitleDiv = parentNode => {
  const titleDiv = parentNode.append('div').attr('class', 'titleDiv')
  titleDiv
    .append('button')
    .attr('class', 'collapseBtn')
    .on('click', collapseEventsDiv)
    .append('i')
    .attr('id', d => `${d.searchValue}BtnI`)
    .attr('class', 'material-icons')
    .style('font-size', '1.2em')
    .text('keyboard_arrow_up')

  titleDiv.append('div').text(d => d.searchValue)
}

const collapseEventsDiv = d => {
  const icon =
    d3.select(`#${d.searchValue}BtnI`).node().textContent ===
    'keyboard_arrow_down'
      ? 'keyboard_arrow_up'
      : 'keyboard_arrow_down'
  d3.select(`#${d.searchValue}BtnI`).text(icon)
  d3.select(`#${d.searchValue}eventsSvgDiv`)
    .transition()
    .duration(300)
    .style('height', d =>
      d3.select(`#${d.searchValue}eventsSvgDiv`).node().clientHeight
        ? '0px'
        : `${totalHeight(d.events.length)}px`
    )
}

const createEventsSvg = parentNode => {
  const eventsDiv = parentNode
    .append('div')
    .attr('class', 'eventsSvgDiv')
    .style('height', d => `${totalHeight(d.events.length)}px`)
    .attr('id', d => `${d.searchValue}eventsSvgDiv`)
  return eventsDiv
    .append('svg')
    .attr('height', '100%')
    .attr('class', 'eventsSvg')
}

const createEventLine = svgParentNode => {
  const event = svgParentNode.selectAll('g').data(
    d => d.events,
    event => event.id
  )
  event.exit().remove()
  const eventLine = event
    .enter()
    .append('g')
    .merge(event)
    .attr('transform', (d, i) => `translate(0,${i * LINE_HEIGHT})`)
  return eventLine
}

const addBackgroundLine = gParentNode =>
  gParentNode
    .append('rect')
    .attr('height', LINE_HEIGHT)
    .attr('width', '100%')
    .attr('class', 'eventLineBackground')
    .attr('fill', (d, i) => (i % 2 === 0 ? '#ffffff' : '#b2ffff66'))

const getBackgroundLineWidth = () => {
  const eventLineBackground = d3.select('.eventLineBackground').node()
  return eventLineBackground ? eventLineBackground.getBBox().width : 0
}

const addTitleText = (gParentNode, eventsTitleWidth) =>
  gParentNode
    .append('text')
    .text(event => event.title)
    .attr('alignment-baseline', 'middle')
    .attr('y', LINE_HEIGHT / 2)
    .attr('x', PADDING_LEFT_TEXT)
    .attr('width', eventsTitleWidth)

const getXScale = (values, eventScheduleWidth) => {
  const mindate = minDate(values)
  const maxdate = maxDate(values)
  const xScale = d3
    .scaleTime()
    .domain([mindate, maxdate])
    .range([0, eventScheduleWidth])
  return xScale
}

const addScheduleRect = (gParentNode, eventsTitleWidth) => {
  gParentNode
    .append('rect')
    .attr('transform', d => `translate(${eventsTitleWidth},0)`)
    .attr('y', LINE_PADDING)
    .attr('height', EVENT_RECT_HEIGHT)
    .attr('fill', event => event.style.bg)
    .attr('rx', 5)
    .attr('class', 'scheduleRect')
}

const redrawScheduleRect = xScale => {
  d3.selectAll('.scheduleRect')
    .attr('x', event => xScale(event.startTime))
    .attr('width', event => xScale(event.endTime) - xScale(event.startTime))
}

const getXAxis = (xScale, maxHeight) =>
  d3
    .axisBottom(xScale)
    .ticks(d3.timeMinute.every(15))
    .tickSize(-maxHeight)

const getTimeline = xScale =>
  d3
    .axisTop(xScale)
    .ticks(d3.timeMinute.every(15))
    .tickSize(5)
    .tickFormat(x =>
      d3.timeFormat('%M')(x) === '00' ? d3.timeFormat('%H:%M')(x) : ''
    )

const buildAxes = eventsTitleWidth => {
  d3.selectAll('.eventsSvg')
    .append('g')
    .attr(
      'transform',
      d => `translate(${eventsTitleWidth},${eventsHeight(d.events.length)})`
    )
    .attr('class', 'line-chart-xaxis')
}

const drawAxes = (xScale, maxHeight) => {
  const xAxis = getXAxis(xScale, maxHeight)
  const timeline = getTimeline(xScale)
  d3.selectAll('.line-chart-xaxis').call(xAxis)

  d3.select('#time')
    .call(timeline)
    .attr('class', 'legend')
}

export const SearchValuesList = ({ values }) => {
  const eventsTitleWidth = values.length ? getEventsTitleWidth(values) : 0

  const searchValueDiv = createSearchValueDivs(values)
  const maxHeight = totalHeight(
    Math.max(...values.map(value => value.events.length))
  )

  // add a title div with collapse button
  addTitleDiv(searchValueDiv)
  // add svg to show all the events
  const eventsSvg = createEventsSvg(searchValueDiv)
  const eventLine = createEventLine(eventsSvg)

  addBackgroundLine(eventLine)
  addTitleText(eventLine, eventsTitleWidth)
  addScheduleRect(eventLine, eventsTitleWidth)
  buildAxes(eventsTitleWidth)

  const redraw = () => {
    const entireLineWidth = getBackgroundLineWidth()
    const eventScheduleWidth = entireLineWidth - eventsTitleWidth
    const xScale = getXScale(values, eventScheduleWidth)
    redrawScheduleRect(xScale)
    drawAxes(xScale, maxHeight)
  }
  redraw()
  window.addEventListener('resize', redraw)

  return (
    <div id="container">
      <div>
        <svg
          height={TIMELINE_HEIGHT}
          width="100%"
          className={values.length ? '' : 'hidden'}
        >
          <g
            id="time"
            transform={`translate(${eventsTitleWidth},${TIMELINE_HEIGHT})`}
          />
        </svg>
      </div>
      <div id="main" className={values.length ? '' : 'hidden'} />
    </div>
  )
}
