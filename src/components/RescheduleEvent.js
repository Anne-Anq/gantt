import { differenceInMinutes, subMinutes, addMinutes } from 'date-fns'

class RescheduleEvent {
  constructor({
    getScheduleRect,
    getRectHandle,
    scale,
    eventSelection,
    minEventDuration
  }) {
    this.getScheduleRect = getScheduleRect
    this.getRectHandle = getRectHandle
    this.eventSelection = eventSelection
    this.minEventDuration = minEventDuration
    this.dragAnchorPoint = undefined
    this.modifiedEvents = undefined
    this.scale = scale
    this.target = undefined
  }

  getModifiedEvents = () => this.modifiedEvents

  setModifiedEvents = modifiedEvents => (this.modifiedEvents = modifiedEvents)

  setDragAnchorPoint = dragAnchorPoint =>
    (this.dragAnchorPoint = dragAnchorPoint)

  getDragAnchorPoint = () => this.dragAnchorPoint

  isActive = () => !!this.getModifiedEvents()

  dragStart = (target, dragAnchorPoint) => {
    this.target = target
    this.setDragAnchorPoint(dragAnchorPoint)
    this.selectedRects = this.getScheduleRect().filter(({ id }) =>
      this.eventSelection.contains(id)
    )

    this.selectedHandles = this.getRectHandle().filter(
      handleData =>
        this.eventSelection.contains(handleData.id) &&
        (!target.time || handleData.time === target.time)
    )
    this.selectedEvents = this.eventSelection.get()
  }

  drag = (d3Event, draggedEventX) => {
    if (d3Event.type === 'start') {
      this.dragStart(d3Event.subject, d3Event.x - draggedEventX)
    } else if (d3Event.type === 'drag') {
      this.moveEvent(d3Event.x)
    } else if (d3Event.type === 'end') {
      return this.dragEnd()
    }
  }

  dragEnd = () => {
    if (this.getModifiedEvents()) {
      this.setDragAnchorPoint()
      this.setModifiedEvents()
      console.log(this.getModifiedEvents())
      return this.getModifiedEvents()
    }
  }

  moveEvent = xCoord => {
    const modifiedEvents = this.getRescheduledEvents(xCoord)
    this.selectedRects
      .attr('x', event => this.scale.get()(modifiedEvents[event.id].startTime))
      .attr(
        'width',
        event =>
          this.scale.get()(modifiedEvents[event.id].endTime) -
          this.scale.get()(modifiedEvents[event.id].startTime)
      )

    this.selectedHandles.attr('cx', handleData =>
      this.scale.get()(modifiedEvents[handleData.id][handleData.time])
    )

    this.setModifiedEvents({ ...this.getModifiedEvents(), ...modifiedEvents })
  }

  getRescheduledEvents = xCoord => {
    const getStartTime = this.getNewStartTime(xCoord)
    const getEndTime = this.getNewEndTime(xCoord)
    return this.eventSelection.get().reduce((result, event) => {
      result[event.id] = {
        startTime:
          this.target.time === 'endTime'
            ? event.startTime
            : getStartTime(event),
        endTime:
          this.target.time === 'startTime' ? event.endTime : getEndTime(event)
      }
      return result
    }, {})
  }

  getNewTime = xCoord => currentTime => {
    const newX =
      xCoord +
      this.scale.get()(currentTime) -
      this.scale.get()(this.target.startTime) -
      this.getDragAnchorPoint()
    return this.scale.get().invert(newX)
  }

  getNewStartTime = xCoord => event => {
    const newTime = this.getNewTime(xCoord)
    if (
      differenceInMinutes(event.endTime, newTime(event.startTime)) <
        this.minEventDuration &&
      !!this.target.time
    ) {
      return subMinutes(event.endTime, this.minEventDuration)
    }
    return newTime(event.startTime)
  }

  getNewEndTime = xCoord => event => {
    const newTime = this.getNewTime(xCoord)
    if (
      differenceInMinutes(newTime(event.endTime), event.startTime) <
        this.minEventDuration &&
      !!this.target.time
    ) {
      return addMinutes(event.startTime, this.minEventDuration)
    }
    return newTime(event.endTime)
  }
}

export { RescheduleEvent }
