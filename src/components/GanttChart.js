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
  //            <i id=`${d.searchValue}BtnI`/>    //addSearchValueTitleDiv
  //          </button>                           //addSearchValueTitleDiv
  //          <div>                               //addSearchValueTitleDiv
  //        </div>                                //addSearchValueTitleDiv
  //        <div id=`${d.searchValue}eventsSvgDiv`//addEventsSvg
  //          <svg class="eventsSvg">             //addEventsSvg
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
  searchValueBtnI = () => {}
  eventsSvgDiv = () => {}
  eventsSvg

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
      .attr('id', d => `${d.searchValue}BtnI`)
      .attr('class', 'material-icons collapseBtnIcon')
      .text('keyboard_arrow_up')

    this.searchValueBtnI = searchValue => d3.select(`#${searchValue}BtnI`)

    this.searchTitleValueDiv.append('div').text(d => d.searchValue)
  }

  addEventsSvg = () => {
    const allEventsventsSvgDivs = this.searchValueDiv
      .append('div')
      .attr('class', 'eventsSvgDiv')
      .style(
        'height',
        d => `${this.getTotalEventsSvgDivHeight(d.events.length)}px`
      )
      .attr('id', d => `${d.searchValue}eventsSvgDiv`)

    this.eventsSvgDiv = searchValue => d3.select(`#${searchValue}eventsSvgDiv`)

    this.eventsSvg = allEventsventsSvgDivs
      .append('svg')
      .attr('class', 'eventsSvg')
  }

  collapseEventsDiv = d => {
    const currentContent = this.searchValueBtnI(d.searchValue).node()
      .textContent
    this.searchValueBtnI(d.searchValue).text(
      currentContent === this.LOGO_DOWN ? this.LOGO_UP : this.LOGO_DOWN
    )
    const currentHeight = this.eventsSvgDiv(d.searchValue).node().clientHeight
    const maxHeight = d => this.getTotalEventsSvgDivHeight(d.events.length)
    this.eventsSvgDiv(d.searchValue)
      .transition()
      .duration(d => d.events.length * 200)
      .style('height', d => (currentHeight ? '0px' : `${maxHeight(d)}px`))
  }

  draw = values => {
    if (!this.getIsInitiated()) {
      return this.init()
    }
    this.setValues(values)
    this.toggleShowMainDivs()
    this.createSearchValueDivs()
  }
}

export { GanttChart }
