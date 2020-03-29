import * as d3 from 'd3'
import { getTicksSpacing, fullDateTimeFormat, getTicksFormat } from './utils'
import { ScaleManager } from './ScaleManager'

class GanttChart {
  constructor(containerId) {
    this.values = []
    this.containerId = containerId
    this.titleWidth = this.DEFAULT_EVENT_TITLE_WIDTH
    this.isInitiated = false
    this.scale = new ScaleManager()
  }

  setValues = values => (this.values = values)

  getValues = () => this.values

  setTitleWidth = titleWidth => (this.titleWidth = titleWidth)

  getTitleWidth = () => this.titleWidth

  setIsInitiated = isInitiated => (this.isInitiated = isInitiated)

  getIsInitiated = () => this.isInitiated

  getTotalEventsSvgDivHeight = eventNumber => eventNumber * this.LINE_HEIGHT

  getHandleX = () => this.getTitleWidth() - this.HANDLE_WIDTH

  moveToTitleWidth = node =>
    node.attr('transform', `translate(${this.getTitleWidth()})`)

  getToolTipLeftOffset = node => {
    const tooltipWidth = node.node().clientWidth
    const containerWidth = this.container.node().clientWidth
    return d3.event.pageX - this.TOOLTIP_PADDING + tooltipWidth < containerWidth
      ? d3.event.pageX - this.TOOLTIP_PADDING
      : containerWidth - tooltipWidth
  }

  getScheduleSectionWidth = () =>
    this.eventLineBackground.node()
      ? this.eventLineBackground.node().getBBox().width - this.getTitleWidth()
      : 0

  getScheduleRange = () => [0, this.getScheduleSectionWidth()]

  handleEvent = event => {
    const eventActionMap = {
      zoom: () => {
        this.scale.zoom(d3.event.transform)
        this.redraw()
      },
      resize: () => {
        this.scale.resize(this.getScheduleRange())
        this.redraw()
      },
      drag: () => {
        this.setTitleWidth(this.getTitleWidth() + d3.event.dx)
        this.scale.resize(this.getScheduleRange())
        this.redraw()
      }
    }
    return eventActionMap[event]
  }

  DEFAULT_EVENT_TITLE_WIDTH = 100
  EVENT_RECT_HEIGHT = 20
  TIMELINE_HEIGHT = this.EVENT_RECT_HEIGHT
  LINE_PADDING = 5
  LINE_HEIGHT = this.EVENT_RECT_HEIGHT + 2 * this.LINE_PADDING
  PADDING_LEFT_TEXT = 28
  HANDLE_WIDTH = 10
  TIMELINE_TICK_SIZE = 5
  LOGO_UP = 'keyboard_arrow_up'
  LOGO_DOWN = 'keyboard_arrow_down'
  TRANSITION_DURATION = 200
  TOOLTIP_PADDING = 15

  container
  timeLineDiv
  timeLegendGroup
  dateTooltip
  scheduleRectTooltip
  main
  searchValueDiv
  searchTitleValueDiv
  getSearchValueBtnI = () => {}
  getEventsSvgDiv = () => {}
  eventsSvg
  getHandleGradient = () => {}
  singleLineGroup
  eventLineBackground
  eventTitleSection
  getEventTitleClipUrl = () => {}
  eventTitleClipRect
  dragHandle
  scheduleSection
  getScheduleClipUrl = () => {}
  scheduleClipRect
  scheduleSectionBackground
  scheduleRect
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
    this.searchTitleValueDiv = this.searchValueDiv
      .append('div')
      .attr('class', 'searchvalueTitleDiv')
    this.searchTitleValueDiv
      .append('button')
      .attr('class', 'collapseBtn')
      .on('click', this.collapseEventsDiv)
      .append('i')
      .attr('id', value => `${value.searchValue}BtnI`)
      .attr('class', 'material-icons collapseBtnIcon')
      .text('keyboard_arrow_up')

    this.getSearchValueBtnI = searchValue => d3.select(`#${searchValue}BtnI`)

    this.searchTitleValueDiv.append('div').text(value => value.searchValue)
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

    this.addSingleEventGroup()
    this.addLineAxisGroup()
  }

  addSingleEventGroup = () => {
    const allEvents = this.eventsSvg.selectAll('g').data(
      value => value.events,
      event => event.id
    )
    allEvents.exit().remove()
    this.singleLineGroup = allEvents
      .enter()
      .append('g')
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
    this.eventTitleSection = this.singleLineGroup
      .append('g')
      .attr('x', 0) // remove ?
      .attr('y', 0) // remove ?

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
    this.eventTitleSection
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
      .attr('x1', '0%')
      .attr('x2', '100%')
    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color:rgb(2,0,36);stop-opacity:1')
    gradient
      .append('stop')
      .attr('offset', '25%')
      .attr('style', 'stop-color:rgb(76,76,128);stop-opacity:1')
    gradient
      .append('stop')
      .attr('offset', '75%')
      .attr('style', 'stop-color:rgb(156,200,209);stop-opacity:1')
    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color:rgb(76,76,128);stop-opacity:1')

    this.getHandleGradient = () => 'url(#handleGradient)'
  }

  addDragHandle = () => {
    this.addHandleGradientDef()
    this.dragHandle = this.singleLineGroup
      .append('rect')
      .attr('width', this.HANDLE_WIDTH)
      .attr('height', this.LINE_HEIGHT)
      .attr('y', 0) // remove?
      .attr('fill', this.getHandleGradient())
      .call(d3.drag().on('drag', this.handleEvent('drag')))
  }

  addScheduleSection = () => {
    this.scheduleSection = this.singleLineGroup.append('g').attr('y', 0) // remove ?
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

    this.addScheduleRect()
  }

  addScheduleRect = () => {
    this.scheduleRect = this.scheduleSection
      .append('g')
      .attr('clip-path', event => this.getScheduleClipUrl(event))
      .append('rect')
      .attr('y', this.LINE_PADDING)
      .attr('height', this.EVENT_RECT_HEIGHT)
      .attr('fill', event => event.style.bg)
      .attr('rx', 5)

    this.scheduleRect
      .on('mouseout', () => {
        this.scheduleRectTooltip
          .style('opacity', 0)
          .selectAll('div')
          .remove()
      })
      .on('mouseover', event => {
        this.addDataToScheduleTooltip(event)
        this.makeScheduleTooltipVisible()
      })
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
      .attr('class', 'detailLabel')
    detailEnter.append('div').text(content => content.value)
    this.scheduleRectTooltip.selectAll('div').sort((a, b) => a.index - b.index)
  }

  makeScheduleTooltipVisible = () => {
    this.scheduleRectTooltip
      .style('top', `${d3.event.pageY + this.TOOLTIP_PADDING}px`)
      .style('left', `${this.getToolTipLeftOffset(this.scheduleRectTooltip)}px`)
      .style('opacity', 1)
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
    this.scheduleSection.call(
      d3
        .zoom()
        .scaleExtent([0.006, 6])
        .on('zoom', this.handleEvent('zoom'))
    )
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
    const maxHeight = 15 //temps
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
    this.addDateTooltipOnLegendHover()
  }

  addDateTooltipOnLegendHover = () => {
    this.getTimeLegendGroupTicks()
      .append('circle')
      .attr('fill', 'transparent')
      .attr('r', this.TOOLTIP_PADDING)
      .attr('y', -this.TIMELINE_HEIGHT)
      .on('mouseout', () => this.dateTooltip.style('opacity', 0))
      .on('mouseover', d => {
        this.dateTooltip
          .text(fullDateTimeFormat(d))
          .style('top', `${d3.event.pageY + this.TOOLTIP_PADDING}px`)
          .style('left', `${this.getToolTipLeftOffset(this.dateTooltip)}px`)
          .style('opacity', 1)
      })
  }

  drawScheduleRect = () => {
    const XScale = this.scale.get()
    this.scheduleRect
      .attr('x', event => XScale(event.startTime))
      .attr('width', event => XScale(event.endTime) - XScale(event.startTime))
  }

  redraw = () => {
    this.drawAxes()
    this.drawScheduleRect()

    // move handle
    this.dragHandle.attr('x', this.getHandleX())
    this.eventTitleClipRect.attr('width', this.getHandleX())
    this.scheduleClipRect.attr('width', this.getScheduleSectionWidth())
    this.scheduleSectionBackground.attr('width', this.getScheduleSectionWidth())
    this.moveToTitleWidth(this.scheduleSection)
    this.moveToTitleWidth(this.lineAxisGroup)
    this.moveToTitleWidth(this.timeLegendGroup)
  }
}

export { GanttChart }

// for reference

//  <div id="container">                  //createMainDivs
//   <div id="timelineDiv">               //createMainDivs
//     <svg >                             //createMainDivs
//       <g>                              //createMainDivs
//         <g id="timeLegendGroup" />     //createMainDivs
//       </g>                             //createMainDivs
//     </svg>                             //createMainDivs
//   </div>                               //createMainDivs
//   <div id="dateTooltip"/>              //createMainDivs
//   <div id="scheduleRectTooltip" />     //createMainDivs
//   <div id="main">                      //createMainDivs
//      <div class="searchValueDiv">         //createSearchValueDivs
//        <div class="searchValueTitleDiv">     //addSearchValueTitleDiv
//          <button class="collapseBtn">        //addSearchValueTitleDiv
//            <i id=`${value.searchValue}BtnI`/>    //addSearchValueTitleDiv
//          </button>                           //addSearchValueTitleDiv
//          <div>                               //addSearchValueTitleDiv
//        </div>                                //addSearchValueTitleDiv
//        <div id=`${value.searchValue}eventsSvgDiv`//addEventsSvg
//          <svg class="eventsSvg">             //addEventsSvg
//            <g>                                 //addSingleEventGroup
//              <rect/>                           //addEventLineBackground
//              <g>                               //addEventTitleSection
//                <defs>                          //addEventTitleSection
//                  <clipPath id=`url(#eventTitleClip_${event.id})`>
//                    <rect/>                     //addEventTitleSection
//                  </clipPath>                   //addEventTitleSection
//                </defs>                         //addEventTitleSection
//                <g clipPath=`url(#eventTitleClip_${event.id})`>
//                  <text/>                       //addTitleText
//                </g>                            //addTitleText
//              </g>                              //addEventTitleSection
//              <rect/>                           //addDragHandle
//              <g>                               //addScheduleSection
//                <defs>                          //addScheduleSection
//                  <clipPath id=`url(#scheduleClip_${event.id})`>
//                    <rect/>                     //addScheduleSection
//                  </clipPath>                   //addScheduleSection
//                </defs>                         //addScheduleSection
//                <g clipPath=`url(#scheduleClip_${event.id})`>
//                  <rect/>                       //addScheduleRect
//                </g>                            //addScheduleRect
//              </g>                              //addScheduleSection
//            </g>                                //addSingleEventGroup
//           +<g>                                 //addSingleEventGroup
//            <g>                                 //addLineAxisGroup
//              <g/>                              //addLineAxisGroup
//            </g>                                //addLineAxisGroup
//          </svg>                              //addEventsSvg
//        </div>                                //addEventsSvg
//      </div>                               //createSearchValueDivs
//    +<div class="searchvalueDiv" />       //createSearchValueDivs
//   </div>                               //createMainDivs
// </div>                                 //createMainDivs
