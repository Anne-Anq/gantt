import * as d3 from 'd3'

class GanttChart {
  constructor(containerId) {
    this.values = []
    this.containerId = containerId
    this.transformEvent = undefined
    this.titleWidth = this.DEFAULT_EVENT_TITLE_WIDTH
    this.isInitiated = false
  }

  setValues = values => {
    this.values = values
  }

  getValues = () => this.values

  setTransformEvent = transformEvent => {
    this.transformEvent = transformEvent
  }

  getTransformEvent = () => this.transformEvent

  setTitleWidth = titleWidth => {
    this.titleWidth = titleWidth
  }

  getTitleWidth = () => this.titleWidth

  setIsInitiated = isInitiated => (this.isInitiated = isInitiated)

  getIsInitiated = () => this.isInitiated

  getTotalEventsSvgDivHeight = eventNumber => eventNumber * this.LINE_HEIGHT

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

  //  <div id="container">                  //createMainDivs
  //   <div id="timelineDiv">               //createMainDivs
  //     <svg >                             //createMainDivs
  //       <g id="timeLegendGroup" />       //createMainDivs
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
  //            <g/>                                //addLineAxisGroup
  //          </svg>                              //addEventsSvg
  //        </div>                                //addEventsSvg
  //      </div>                               //createSearchValueDivs
  //    +<div class="searchvalueDiv" />       //createSearchValueDivs
  //   </div>                               //createMainDivs
  // </div>                                 //createMainDivs
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
  singleLineGroup
  eventLineBackground
  eventTitleSection
  getEventTitleClipUrl = () => {}
  eventTitleClipRect
  dragHandle
  scheduleSection
  getScheduleClipUrl = () => {}
  scheduleRect
  lineAxisGroup

  init = () => {
    this.container = d3.select(`#${this.containerId}`)
    this.timelineDiv = this.container.append('div').attr('id', 'timelineDiv')
    this.timeLegendGroup = this.timelineDiv
      .append('svg')
      .attr('height', this.TIMELINE_HEIGHT)
      .attr('width', '100%')
      .append('g')
      .attr('id', 'timeLegendGroup')

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

  addDragHandle = () => {
    this.dragHandle = this.singleLineGroup
      .append('rect')
      .attr('width', this.HANDLE_WIDTH)
      .attr('height', this.LINE_HEIGHT)
      .attr('y', 0) // remove?
      .attr('fill', 'purple') // temp
      .call(
        d3.drag().on('drag', () => {
          this.setTitleWidth(this.getTitleWidth() + d3.event.dx)
          this.redraw()
        })
      )
  }

  addScheduleSection = () => {
    this.scheduleSection = this.singleLineGroup.append('g').attr('y', 0) // remove ?
    const scheduleClip = this.scheduleSection
      .append('defs')
      .append('clipPath')
      .attr('id', event => `scheduleClip_${event.id}`)

    this.getScheduleClipUrl = event => `url(#scheduleClip_${event.id})`

    scheduleClip
      .append('rect')
      .attr('height', this.LINE_HEIGHT)
      .attr('width', '100%') // if this is removed clip size does not adjust

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
    const tooltipWidth = this.scheduleRectTooltip.node().clientWidth
    const containerWidth = this.container.node().clientWidth
    const leftOffset =
      d3.event.pageX - this.TOOLTIP_PADDING + tooltipWidth < containerWidth
        ? d3.event.pageX - this.TOOLTIP_PADDING
        : containerWidth - tooltipWidth

    this.scheduleRectTooltip
      .style('top', `${d3.event.pageY + this.TOOLTIP_PADDING}px`)
      .style('left', `${leftOffset}px`)
      .style('opacity', 1)
  }

  addLineAxisGroup = () => {
    this.lineAxisGroup = this.eventsSvg.append('g')
  }
  draw = values => {
    if (!this.getIsInitiated()) {
      return this.init()
    }
    this.setValues(values)
    this.toggleShowMainDivs()
    this.createSearchValueDivs()
  }

  redraw = () => {
    console.log('redrawing', this.getTitleWidth())
  }
}

export { GanttChart }
