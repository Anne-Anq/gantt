import React from 'react'
import { min, max } from 'date-fns'
import * as d3 from 'd3'
import './style.css'

const minDate = values =>
  min(values.flatMap(({ events }) => events.map(event => event.startTime)))

const maxDate = values =>
  max(values.flatMap(({ events }) => events.map(event => event.endTime)))

const EVENT_RECT_HEIGHT = 20
const LINE_PADDING = 5
const LINE_HEIGHT = EVENT_RECT_HEIGHT + 2 * LINE_PADDING
const SCALE_HEIGHT = 20
const CHAR_WIDTH = 10
const eventsHeight = eventNumber => eventNumber * LINE_HEIGHT
const totalHeight = eventNumber => eventsHeight(eventNumber) + SCALE_HEIGHT
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
  console.log(parentNode)
  const titleDiv = parentNode.append('div').attr('class', 'titleDiv')
  titleDiv
    .append('button')
    .append('i')
    .attr('class', 'material-icons')
    .text('keyboard_arrow_up')
  titleDiv.append('div').text(d => d.searchValue)
}

const createEventsSvg = parentNode => {
  console.log(parentNode)
  const eventsDiv = parentNode.append('div').attr('class', 'eventsSvgDiv')
  return eventsDiv
    .append('svg')
    .attr('height', d => totalHeight(d.events.length))
    .attr('class', 'eventsSvg')
}

const createEventLine = svgParentNode => {
  const event = svgParentNode.selectAll('g').data(
    d => d.events,
    event => event.id
  )
  // console.log(event)
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
    .attr('fill', (d, i) => (i % 2 !== 0 ? '#ffffff' : '#b2ffff66'))

const getBackgroundLineWidth = () => {
  const eventLineBackground = d3.select('.eventLineBackground').node()
  return eventLineBackground ? eventLineBackground.getBBox().width : 0
}

const addTitleText = (gParentNode, eventsTitleWidth) =>
  gParentNode
    .append('text')
    .text(event => event.title)
    .attr('fill', event => event.style.bg)
    .attr('alignment-baseline', 'middle')
    .attr('y', LINE_HEIGHT / 2)
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

const addScheduleRect = (gParentNode, xScale, eventsTitleWidth) => {
  gParentNode
    .append('rect')
    .attr('transform', d => `translate(${eventsTitleWidth},0)`)
    .attr('y', LINE_PADDING)
    .attr('height', EVENT_RECT_HEIGHT)
    .attr('fill', event => event.style.bg)
    .attr('rx', 5)
    .attr('class', 'scheduleRect')
  redrawScheduleRect(xScale)
}

const redrawScheduleRect = xScale => {
  d3.selectAll('.scheduleRect')
    .attr('x', event => xScale(event.startTime))
    .attr('width', event => xScale(event.endTime) - xScale(event.startTime))
}

const getXAxis = xScale =>
  d3
    .axisBottom(xScale)
    .ticks(d3.timeMinute.every(15))
    .tickSize(5)
    .tickFormat(x =>
      d3.timeFormat('%M')(x) === '00' ? d3.timeFormat('%H:%M')(x) : ''
    )

const buildAxes = (eventsTitleWidth, eventScheduleWidth) => {
  d3.selectAll('.eventsSvg')
    .append('g')
    .attr(
      'transform',
      d => `translate(${eventsTitleWidth},${eventsHeight(d.events.length)})`
    )
    .attr('class', 'line-chart-xaxis')
}

const drawAxes = xAxis => {
  d3.selectAll('.line-chart-xaxis').call(xAxis)
}

export const SearchValuesList = ({ values }) => {
  const eventsTitleWidth = getEventsTitleWidth(values)

  const searchValueDiv = createSearchValueDivs(values)

  // add a title div with collapse button
  addTitleDiv(searchValueDiv)
  // add svg to show all the events
  const eventsSvg = createEventsSvg(searchValueDiv)
  const eventLine = createEventLine(eventsSvg)

  addBackgroundLine(eventLine)
  addTitleText(eventLine, eventsTitleWidth)
  const entireLineWidth = getBackgroundLineWidth()
  const eventScheduleWidth = entireLineWidth - eventsTitleWidth
  const xScale = getXScale(values, eventScheduleWidth)
  addScheduleRect(eventLine, xScale, eventsTitleWidth)
  buildAxes(eventsTitleWidth, eventScheduleWidth)
  const xAxis = getXAxis(xScale)
  drawAxes(xAxis)

  const redraw = () => {
    const entireLineWidth = getBackgroundLineWidth()
    const eventScheduleWidth = entireLineWidth - eventsTitleWidth
    console.log(entireLineWidth)
    // define the x scale
    const xScale = getXScale(values, eventScheduleWidth)
    //event schedule
    redrawScheduleRect(xScale)
    // define axis
    const xAxis = getXAxis(xScale)
    drawAxes(xAxis)
  }

  window.addEventListener('resize', redraw)

  return <div id="main" />
}
