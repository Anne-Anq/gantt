import * as d3 from 'd3'
import { getTicksSpacing, fullDateTimeFormat, getTicksFormat } from './utils'
import { ScaleManager } from './ScaleManager'
import tinycolor from 'tinycolor2'
import { differenceInMinutes, subMinutes, addMinutes } from 'date-fns'
class GanttChart {
  constructor({
    containerId,
    onMoveEvents = () => {},
    onBoundariesChange = () => {},
    minEventDuration = 1
  }) {
    this.values = []
    this.containerId = containerId
    this.titleWidth = this.DEFAULT_EVENT_TITLE_WIDTH
    this.isInitiated = false
    this.scale = new ScaleManager()
    this.selectedEvents = []
    this.isCtrlKeyDown = false
    this.onMoveEvents = onMoveEvents
    this.modifiedEvents = undefined
    this.onBoundariesChange = onBoundariesChange
    this.isZooming = false
    this.dragAnchorPoint = undefined
    this.minEventDuration = minEventDuration
  }

  setValues = values => (this.values = values)

  getValues = () => this.values

  setTitleWidth = titleWidth => (this.titleWidth = titleWidth)

  getTitleWidth = () => this.titleWidth

  setIsInitiated = isInitiated => (this.isInitiated = isInitiated)

  getIsInitiated = () => this.isInitiated

  setSelectedEvents = selectedEvents => (this.selectedEvents = selectedEvents)

  getSelectedEvents = () => this.selectedEvents

  setIsCtrlKeyDown = isCtrlKeyDown => (this.isCtrlKeyDown = isCtrlKeyDown)

  getIsCtrlKeyDown = () => this.isCtrlKeyDown

  setModifiedEvents = modifiedEvents => (this.modifiedEvents = modifiedEvents)

  getModifiedEvents = () => this.modifiedEvents

  setIsZooming = isZooming => (this.isZooming = isZooming)

  getIsZooming = () => this.isZooming

  setDragAnchorPoint = dragAnchorPoint =>
    (this.dragAnchorPoint = dragAnchorPoint)

  getDragAnchorPoint = () => this.dragAnchorPoint

  getTotalEventsSvgDivHeight = eventNumber => eventNumber * this.LINE_HEIGHT

  getHandleX = () => this.getTitleWidth() - this.HANDLE_WIDTH

  moveToTitleWidth = node =>
    node.attr('transform', `translate(${this.getTitleWidth()})`)

  getToolTipLeftOffset = (tooltipNode, refLeftX) => {
    const tooltipWidth = tooltipNode.clientWidth // if display is none this width is 0
    const containerWidth = this.container.node().clientWidth

    const minLeftOffset =
      refLeftX - this.TOOLTIP_PADDING + tooltipWidth < containerWidth
        ? refLeftX - this.TOOLTIP_PADDING
        : containerWidth - tooltipWidth

    const tooltipRightX = minLeftOffset + tooltipWidth
    const arrowRightX =
      d3.event.pageX + this.TOOLTIP_PADDING + this.ARROW_HALF_WIDTH
    const distanceTooltipToArrow = tooltipRightX - arrowRightX

    return distanceTooltipToArrow > 0
      ? minLeftOffset
      : minLeftOffset - distanceTooltipToArrow
  }

  getScheduleSectionWidth = () =>
    this.eventLineBackground.node()
      ? this.eventLineBackground.node().getBBox().width - this.getTitleWidth()
      : 0

  getScheduleRange = () => [0, this.getScheduleSectionWidth()]

  handleEvent = event => {
    const eventActionMap = {
      mousedownSchedule: () => {
        this.scheduleSectionBackground.style('cursor', 'grabbing')
        this.unselectAllEvents()
      },
      zoomEnd: () => {
        this.setIsZooming(false)
        this.scheduleSectionBackground.style('cursor', 'grab')
        if (!d3.event.sourceEvent) {
          this.onBoundariesChange(this.scale.getTimeBoundaries())
        }
      },
      zoom: () => {
        this.setIsZooming(true)
        this.scale.zoom(d3.event.transform)
        this.redraw()
        this.removeScheduleTooltip()
      },
      resize: () => {
        this.scale.resize(this.getScheduleRange())
        this.redraw()
      },
      drag: () => {
        this.setTitleWidth(this.getTitleWidth() + d3.event.dx)
        this.scale.resize(this.getScheduleRange())
        this.redraw()
      },
      clickRect: event => {
        d3.event.stopPropagation()
        if (!this.getIsCtrlKeyDown()) {
          if (
            this.isEventSelected(event.id) &&
            this.getSelectedEvents().length === 1
          ) {
            this.unselectEvent(event)
          } else {
            this.selectOnlyEvent(event)
          }
        } else {
          if (this.isEventSelected(event.id)) {
            this.unselectEvent(event)
          } else {
            this.selectAdditionalEvent(event)
          }
        }
      },
      dragRect: () => {
        if (
          d3.event.type === 'drag' &&
          this.isEventSelected(d3.event.subject.id)
        ) {
          this.removeScheduleTooltip()
          if (!this.getDragAnchorPoint()) {
            this.setDragAnchorPoint(
              d3.event.x -
                this.getScheduleRectsByEvent(d3.event.subject).attr('x')
            )
          }
          this.moveEvents(d3.event.subject, d3.event.x)
        } else if (d3.event.type === 'end' && this.getModifiedEvents()) {
          this.setDragAnchorPoint()
          this.onMoveEvents(this.getModifiedEvents())
          this.setModifiedEvents()
        }
      },
      keydown: () => {
        if (d3.event.key === 'Escape') {
          this.unselectAllEvents()
        }
        if (d3.event.key === 'Control') {
          this.setIsCtrlKeyDown(true)
        }
      },
      keyup: () => {
        if (d3.event.key === 'Control') {
          this.setIsCtrlKeyDown(false)
        }
      }
    }
    return eventActionMap[event]
  }

  isEventSelected = eventId =>
    !!this.getSelectedEvents().find(({ id }) => id === eventId)

  selectAdditionalEvent = event => {
    this.setSelectedEvents([...this.getSelectedEvents(), event])
    this.formatSelectedEvents()
  }

  selectOnlyEvent = event => {
    this.setSelectedEvents([event])
    this.formatSelectedEvents()
  }

  unselectEvent = event => {
    this.setSelectedEvents(
      this.getSelectedEvents().filter(({ id }) => id !== event.id)
    )
    this.formatSelectedEvents()
  }

  unselectAllEvents = () => {
    this.setSelectedEvents([])
    this.formatSelectedEvents()
  }

  DEFAULT_EVENT_TITLE_WIDTH = 100
  EVENT_RECT_HEIGHT = 20
  TIMELINE_HEIGHT = this.EVENT_RECT_HEIGHT
  LINE_PADDING = 5
  LINE_HEIGHT = this.EVENT_RECT_HEIGHT + 2 * this.LINE_PADDING
  PADDING_LEFT_TEXT = 28
  HANDLE_WIDTH = 5
  TIMELINE_TICK_SIZE = 5
  LOGO_UP = 'keyboard_arrow_up'
  LOGO_DOWN = 'keyboard_arrow_down'
  TRANSITION_DURATION = 200
  TRANSITION_DELAY = 800
  TOOLTIP_PADDING = 15
  ARROW_HALF_WIDTH = 8
  TIMES = ['startTime', 'endTime']

  container
  timeLineDiv
  timeLegendGroup
  dateTooltip
  scheduleRectTooltip
  scheduleRectTooltipArrow
  getTooltipDataDivs = () => {}
  main
  searchValueDiv
  searchValueTitleDiv
  getSearchValueBtnI = () => {}
  getEventsSvgDiv = () => {}
  eventsSvg
  getHandleGradient = () => {}
  singleLineGroup
  eventLineBackground
  eventTitleSection
  eventTitleText
  getEventTitleClipUrl = () => {}
  eventTitleClipRect
  dragHandle
  scheduleSection
  getScheduleClipUrl = () => {}
  scheduleClipRect
  scheduleSectionBackground
  scheduleRect
  rectHandle
  getScheduleRectsByEvent = () => {}
  lineAxisGroup
  getTimeLegendGroupTicks = () => {}

  init = () => {
    this.container = d3.select(`#${this.containerId}`)
    this.timelineDiv = this.container.append('div').attr('id', 'timelineDiv')
    this.timeLegendGroup = this.timelineDiv
      .append('svg')
      .attr('height', this.TIMELINE_HEIGHT)
      .attr('width', '100%')
      .append('g')
      .attr('transform', `translate(0,${this.TIMELINE_HEIGHT})`)
      .append('g')
      .attr('id', 'timeLegendGroup')

    this.getTimeLegendGroupTicks = () => d3.selectAll('#timeLegendGroup g.tick')

    this.dateTooltip = this.container
      .append('div')
      .attr('id', 'dateTooltip')
      .classed('tooltip', true)
    this.scheduleRectTooltip = this.container
      .append('div')
      .attr('id', 'scheduleRectTooltip')
      .classed('tooltip', true)

    this.scheduleRectTooltipArrow = this.scheduleRectTooltip
      .append('div')
      .attr('id', 'scheduleRectTooltipArrow')

    this.main = this.container.append('div').attr('id', 'main')
    this.toggleShowMainDivs()
    this.setIsInitiated(true)
  }

  toggleShowMainDivs = () => {
    this.timeLegendGroup.classed('hidden', !this.getValues().length)
    this.main.classed('hidden', !this.getValues().length)
  }

  createSearchValueDivs = () => {
    const allValues = this.main
      .selectAll('div')
      .data(this.getValues(), value => value.searchValue)
    allValues.exit().remove()
    this.searchValueDiv = allValues
      .enter()
      .append('div')
      .attr('class', 'searchValueDiv')
      .merge(allValues)

    this.addSearchValueTitleDiv()
    this.addEventsSvg()
  }

  addSearchValueTitleDiv = () => {
    this.searchValueTitleDiv = this.searchValueDiv
      .append('div')
      .attr('class', 'searchvalueTitleDiv')
    this.searchValueTitleDiv
      .append('button')
      .attr('class', 'collapseBtn')
      .on('click', this.collapseEventsDiv)
      .append('i')
      .attr('id', value => `${value.searchValue}BtnI`)
      .attr('class', 'material-icons collapseBtnIcon')
      .text('keyboard_arrow_up')

    this.getSearchValueBtnI = searchValue => d3.select(`#${searchValue}BtnI`)

    this.searchValueTitleDiv.append('div').text(value => value.searchValue)
  }

  collapseEventsDiv = value => {
    const currentContent = this.getSearchValueBtnI(value.searchValue).node()
      .textContent
    this.getSearchValueBtnI(value.searchValue).text(
      currentContent === this.LOGO_DOWN ? this.LOGO_UP : this.LOGO_DOWN
    )
    const maxHeight = value =>
      this.getTotalEventsSvgDivHeight(value.events.length)
    this.getEventsSvgDiv(value.searchValue)
      .transition()
      .duration(value => value.events.length * this.TRANSITION_DURATION)
      .style('height', value =>
        currentContent === this.LOGO_DOWN ? `${maxHeight(value)}px` : '0px'
      )
  }

  addEventsSvg = () => {
    const maxHeight = value =>
      this.getTotalEventsSvgDivHeight(value.events.length)
    const allEventsventsSvgDivs = this.searchValueDiv
      .append('div')
      .attr('class', 'eventsSvgDiv')
      .style('height', value => `${maxHeight(value)}px`)
      .attr('id', value => `${value.searchValue}eventsSvgDiv`)

    this.getEventsSvgDiv = searchValue =>
      d3.select(`#${searchValue}eventsSvgDiv`)

    this.eventsSvg = allEventsventsSvgDivs
      .append('svg')
      .attr('class', 'eventsSvg')

    this.addLineAxisGroup()
    this.addSingleEventGroup()
  }

  addSingleEventGroup = () => {
    const allEvents = this.eventsSvg.selectAll('g.event').data(
      value => value.events,
      event => event.id
    )
    allEvents.exit().remove()
    this.singleLineGroup = allEvents
      .enter()
      .append('g')
      .attr('class', 'event')
      .merge(allEvents)
      .attr(
        'transform',
        (_event, eventIndex) => `translate(0,${eventIndex * this.LINE_HEIGHT})`
      )

    this.addEventLineBackground()
    this.addEventSections()
  }

  addEventLineBackground = () => {
    this.eventLineBackground = this.singleLineGroup
      .append('rect')
      .attr('height', this.LINE_HEIGHT)
      .attr('width', '100%') // removing this prevents rescale on window resize
      .attr('class', (_d, i) => `${i % 2 === 0 ? 'evenLine' : 'oddLine'}`)
  }

  addEventSections = () => {
    this.addEventTitleSection()
    this.addDragHandle()
    this.addScheduleSection()
  }

  addEventTitleSection = () => {
    this.eventTitleSection = this.singleLineGroup.append('g')

    const eventTitleClip = this.eventTitleSection
      .append('defs')
      .append('clipPath')
      .attr('id', event => `eventTitleClip_${event.id}`)

    this.getEventTitleClipUrl = event => `url(#eventTitleClip_${event.id})`

    this.eventTitleClipRect = eventTitleClip
      .append('rect')
      .attr('height', this.LINE_HEIGHT)

    this.addTitleText()
  }

  addTitleText = () => {
    this.eventTitleText = this.eventTitleSection
      .append('g')
      .attr('clip-path', event => this.getEventTitleClipUrl(event))
      .append('text')
      .text(event => event.title)
      .attr('class', 'eventTitleText')
      .attr('y', this.LINE_HEIGHT / 2)
      .attr('x', this.PADDING_LEFT_TEXT)
  }

  addHandleGradientDef = () => {
    const gradient = this.singleLineGroup
      .append('defs')
      .append('linearGradient')
      .attr('id', 'handleGradient')

    const addGradientStop = (offset, style) => {
      gradient
        .append('stop')
        .attr('offset', `${offset}%`)
        .attr('style', style)
    }
    addGradientStop(0, 'stop-color:rgb(2,0,36);stop-opacity:1')
    addGradientStop(25, 'stop-color:rgb(76,76,128);stop-opacity:1')
    addGradientStop(75, 'stop-color:rgb(156,200,209);stop-opacity:1')
    addGradientStop(100, 'stop-color:rgb(76,76,128);stop-opacity:1')

    this.getHandleGradient = () => 'url(#handleGradient)'
  }

  addDragHandle = () => {
    this.addHandleGradientDef()
    this.dragHandle = this.singleLineGroup
      .append('rect')
      .attr('width', this.HANDLE_WIDTH)
      .attr('height', this.LINE_HEIGHT)
      .attr('fill', this.getHandleGradient())
      .style('cursor', 'ew-resize')
      .call(d3.drag().on('drag', this.handleEvent('drag')))
  }

  addScheduleSection = () => {
    this.scheduleSection = this.singleLineGroup.append('g')
    const scheduleClip = this.scheduleSection
      .append('defs')
      .append('clipPath')
      .attr('id', event => `scheduleClip_${event.id}`)

    this.getScheduleClipUrl = event => `url(#scheduleClip_${event.id})`

    this.scheduleClipRect = scheduleClip
      .append('rect')
      .attr('height', this.LINE_HEIGHT)

    this.scheduleSectionBackground = this.scheduleSection
      .append('rect')
      .attr('fill', 'rgba(255, 255, 255, 0.5)')
      .attr('height', this.LINE_HEIGHT)
      .style('cursor', 'grab')

    this.scheduleSectionBackground.on(
      'mousedown',
      this.handleEvent('mousedownSchedule')
    )

    this.addScheduleRect()
  }

  addScheduleRect = () => {
    const scheduleGroup = this.scheduleSection
      .append('g')
      .attr('clip-path', event => this.getScheduleClipUrl(event))
    this.scheduleRect = scheduleGroup
      .append('rect')
      .attr('class', event => `scheduleRect_${event.id}`)
      .attr('y', this.LINE_PADDING)
      .attr('height', this.EVENT_RECT_HEIGHT)
      .attr('fill', event => event.style.bg)
      .attr('rx', 5)
      .style('cursor', 'pointer')

    this.rectHandle = scheduleGroup
      .selectAll('circle')
      .data(event => this.TIMES.map(time => ({ time, ...event })))
      .enter()
      .append('circle')
      .attr('fill', handleData =>
        tinycolor(handleData.style.bg)
          .lighten(20)
          .toString()
      )
      .attr('stroke', handleData => handleData.style.bg)
      .attr('stroke-width', 2)
      .attr('cy', this.EVENT_RECT_HEIGHT / 2 + this.LINE_PADDING)
      .attr('r', 4)
      .style('cursor', 'ew-resize')
      .attr('visibility', 'hidden')
      .call(d3.drag().on('drag end', this.handleEvent('dragRect')))

    this.getScheduleRectsByEvent = event =>
      d3.selectAll(`.scheduleRect_${event.id}`)

    const onMouseOver = (event, thatScheduleRectNode) => {
      if (!this.getIsZooming() && !this.getModifiedEvents()) {
        this.addDataToScheduleTooltip(event)
        this.makeScheduleTooltipVisible(thatScheduleRectNode)
      }
    }

    const onMouseMove = this.moveTooltip

    this.scheduleRect
      .on('mouseout', this.removeScheduleTooltip)
      .on('mouseover', function(event) {
        // thanks to anonymous fn I can get `this` scheduleRect
        onMouseOver(event, this)
      })
      .on('mousemove', function() {
        // thanks to anonymous fn I can get `this` scheduleRect
        onMouseMove(this)
      })
      .on('click', this.handleEvent('clickRect'))
      .call(d3.drag().on('drag end', this.handleEvent('dragRect')))
  }

  removeScheduleTooltip = () => {
    if (this.getTooltipDataDivs()) {
      this.getTooltipDataDivs().remove()
    }
    this.scheduleRectTooltip.style('display', 'none')
  }

  formatSelectedEvents = () => {
    this.scheduleRect
      .filter(({ id }) => this.isEventSelected(id))
      .attr('fill', event =>
        tinycolor(event.style.bg)
          .lighten(20)
          .toString()
      )
      .attr('stroke', event => event.style.bg)
      .attr('stroke-width', 2)
      .style('cursor', 'move')

    this.rectHandle
      .filter(({ id }) => this.isEventSelected(id))
      .attr('visibility', 'visible')

    this.eventTitleText
      .filter(({ id }) => this.isEventSelected(id))
      .style('font-weight', 'bold')

    this.scheduleRect
      .filter(({ id }) => !this.isEventSelected(id))
      .attr('stroke-width', 0)
      .attr('fill', event => event.style.bg)
      .style('cursor', 'pointer')

    this.eventTitleText
      .filter(({ id }) => !this.isEventSelected(id))
      .style('font-weight', 'normal')

    this.rectHandle
      .filter(({ id }) => !this.isEventSelected(id))
      .attr('visibility', 'hidden')
  }

  addDataToScheduleTooltip = event => {
    const contentWithIndex = event.detailContent.map((content, index) => ({
      ...content,
      index
    }))
    const detailEnter = this.scheduleRectTooltip
      .selectAll('div')
      .data(contentWithIndex)
      .enter()

    detailEnter
      .append('div')
      .text(content => content.label)
      .attr('class', 'detailLabel detail')
    detailEnter
      .append('div')
      .text(content => content.value)
      .attr('class', 'detail')

    this.getTooltipDataDivs = () =>
      this.scheduleRectTooltip.selectAll('div.detail')

    this.scheduleRectTooltip.selectAll('div').sort((a, b) => a.index - b.index)
  }

  makeScheduleTooltipVisible = thatScheduleRectNode => {
    const topOffset =
      thatScheduleRectNode.getBoundingClientRect().top +
      this.EVENT_RECT_HEIGHT +
      window.pageYOffset +
      this.TOOLTIP_PADDING
    this.scheduleRectTooltip
      .style('display', 'grid')
      .style('top', `${topOffset}px`)
    this.moveTooltip(thatScheduleRectNode)
    this.scheduleRectTooltip
      .style('opacity', 0)
      .transition()
      .duration(this.TRANSITION_DURATION)
      .delay(this.TRANSITION_DELAY)
      .style('opacity', 1)
  }

  moveTooltip = thatScheduleRectNode => {
    const tooltipOffset = this.getToolTipLeftOffset(
      this.scheduleRectTooltip.node(),
      thatScheduleRectNode.getBoundingClientRect().left
    )
    this.scheduleRectTooltip.style('left', `${tooltipOffset}px`)
    const arrowOffset = d3.event.pageX - this.ARROW_HALF_WIDTH - tooltipOffset
    this.scheduleRectTooltipArrow.style('left', `${arrowOffset}px`)
  }

  addLineAxisGroup = () => {
    const maxHeight = value =>
      this.getTotalEventsSvgDivHeight(value.events.length)
    this.lineAxisGroup = this.eventsSvg
      .append('g')
      .attr('transform', value => `translate(0,${maxHeight(value)})`)
      .append('g')
  }

  addListeners = () => {
    window.addEventListener('resize', this.handleEvent('resize'))
    d3.select('body').on('keydown', this.handleEvent('keydown'))
    d3.select('body').on('keyup', this.handleEvent('keyup'))
    this.scheduleSection
      .call(
        d3
          .zoom()
          .scaleExtent([0.06, 6])
          .on('zoom', this.handleEvent('zoom'))
          .on('end', this.handleEvent('zoomEnd'))
      )
      .on('dblclick.zoom', null)
  }
  draw = values => {
    if (!this.getIsInitiated()) {
      return this.init()
    }
    this.setValues(values)
    this.toggleShowMainDivs()
    this.createSearchValueDivs()
    this.addListeners()
    this.scale.resize(this.getScheduleRange())
    this.redraw()
  }

  drawAxes = () => {
    const maxEventsNum = Math.max(
      ...this.getValues().map(value => value.events.length)
    )
    const maxHeight = this.getTotalEventsSvgDivHeight(maxEventsNum)
    const XScale = this.scale.get()
    this.lineAxisGroup.call(
      d3
        .axisBottom(XScale)
        .ticks(getTicksSpacing(XScale))
        .tickSize(-maxHeight)
    )
    this.timeLegendGroup.call(
      d3
        .axisTop(XScale)
        .ticks(getTicksSpacing(XScale))
        .tickSize(this.TIMELINE_TICK_SIZE)
        .tickFormat(x => getTicksFormat(XScale, x))
    )
    this.getTimeLegendGroupTicks().style('cursor', 'default')
    this.addDateTooltipOnLegendHover()
  }

  addDateTooltipOnLegendHover = () => {
    this.getTimeLegendGroupTicks()
      .append('circle')
      .attr('fill', 'transparent')
      .attr('r', this.TOOLTIP_PADDING)
      .attr('y', -this.TIMELINE_HEIGHT)
      .on('mouseout', () => this.dateTooltip.transition().style('opacity', 0))
      .on('mouseover', d => {
        this.dateTooltip
          .text(fullDateTimeFormat(d))
          .style('top', `${d3.event.pageY + this.TOOLTIP_PADDING}px`)
          .style(
            'left',
            `${this.getToolTipLeftOffset(
              this.dateTooltip.node(),
              d3.event.pageX
            )}px`
          )
          .style('opacity', 0)
          .transition()
          .duration(this.TRANSITION_DURATION)
          .delay(this.TRANSITION_DELAY)
          .style('opacity', 1)
      })
  }

  drawScheduleRect = () => {
    const XScale = this.scale.get()
    this.scheduleRect
      .attr('x', event => XScale(event.startTime))
      .attr('width', event => XScale(event.endTime) - XScale(event.startTime))
    this.rectHandle.attr('cx', handleData =>
      XScale(handleData[handleData.time])
    )
  }

  moveEvents = (target, xCoord) => {
    const XScale = this.scale.get()

    const modifiedEvents = this.getRescheduledEvents(target, xCoord)
    this.scheduleRect
      .filter(({ id }) => this.isEventSelected(id))
      .attr('x', event => XScale(modifiedEvents[event.id].startTime))
      .attr(
        'width',
        event =>
          XScale(modifiedEvents[event.id].endTime) -
          XScale(modifiedEvents[event.id].startTime)
      )

    this.rectHandle
      .filter(
        handleData =>
          this.isEventSelected(handleData.id) &&
          (!target.time || handleData.time === target.time)
      )
      .attr('cx', handleData =>
        XScale(modifiedEvents[handleData.id][handleData.time])
      )

    this.setModifiedEvents({ ...this.getModifiedEvents(), ...modifiedEvents })
  }

  getRescheduledEvents = (target, xCoord) => {
    const getStartTime = this.getNewStartTime(target, xCoord)
    const getEndTime = this.getNewEndTime(target, xCoord)
    return this.getSelectedEvents().reduce((result, event) => {
      result[event.id] = {
        startTime:
          target.time === 'endTime' ? event.startTime : getStartTime(event),
        endTime: target.time === 'startTime' ? event.endTime : getEndTime(event)
      }
      return result
    }, {})
  }

  getNewTime = (target, xCoord) => currentTime => {
    const newX =
      xCoord +
      this.scale.get()(currentTime) -
      this.scale.get()(target.startTime) -
      this.getDragAnchorPoint()
    return this.scale.get().invert(newX)
  }

  getNewStartTime = (target, xCoord) => event => {
    const newTime = this.getNewTime(target, xCoord)
    if (
      differenceInMinutes(event.endTime, newTime(event.startTime)) <
        this.minEventDuration &&
      !!target.time
    ) {
      return subMinutes(event.endTime, this.minEventDuration)
    }
    return newTime(event.startTime)
  }

  getNewEndTime = (target, xCoord) => event => {
    const newTime = this.getNewTime(target, xCoord)
    if (
      differenceInMinutes(newTime(event.endTime), event.startTime) <
        this.minEventDuration &&
      !!target.time
    ) {
      return addMinutes(event.startTime, this.minEventDuration)
    }
    return newTime(event.endTime)
  }

  moveHandle = () => {
    this.dragHandle.attr('x', this.getHandleX())
    this.eventTitleClipRect.attr('width', this.getHandleX())
    this.scheduleClipRect.attr('width', this.getScheduleSectionWidth())
    this.scheduleSectionBackground.attr('width', this.getScheduleSectionWidth())
    this.moveToTitleWidth(this.scheduleSection)
    this.moveToTitleWidth(this.lineAxisGroup)
    this.moveToTitleWidth(this.timeLegendGroup)
  }

  redraw = () => {
    this.drawAxes()
    this.drawScheduleRect()
    this.moveHandle()
  }
}

export { GanttChart }
