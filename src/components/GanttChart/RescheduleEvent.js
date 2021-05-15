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
    this.scale = scale
    this.eventSelection = eventSelection
    this.minEventDuration = minEventDuration
    this.dragAnchorPoint = undefined
    this.modifiedEvents = undefined
    this.target = undefined
  }

  _setModifiedEvents = modifiedEvents => (this.modifiedEvents = modifiedEvents)
  _getModifiedEvents = () => this.modifiedEvents

  _setDragAnchorPoint = dragAnchorPoint =>
    (this.dragAnchorPoint = dragAnchorPoint)
  _getDragAnchorPoint = () => this.dragAnchorPoint

  _setTarget = target => (this.target = target)
  _getTarget = () => this.target

  isActive = () => !!this._getModifiedEvents()

  drag = (d3Event, draggedEventX) => {
    switch (d3Event.type) {
      case 'start':
        this._setTarget(d3Event.subject)
        this._setDragAnchorPoint(d3Event.x - draggedEventX)
        break
      case 'drag':
        this._reschedule(d3Event.x)
        break
      case 'end':
        if (this._getModifiedEvents()) {
          return this._getModifiedEvents()
        }
        break
      default: {
        break
      }
    }
  }

  _reschedule = xCoord => {
    const modifiedEvents = this._getRescheduledEvents(xCoord)
    this._moveEvents(modifiedEvents)
    this._moveHandles(modifiedEvents)
    this._setModifiedEvents({ ...this._getModifiedEvents(), ...modifiedEvents })
  }

  _moveEvents = modifiedEvents =>
    this.getScheduleRect()
      .filter(({ id }) => this.eventSelection.contains(id))
      .attr('x', event => this.scale.get()(modifiedEvents[event.id].startTime))
      .attr(
        'width',
        event =>
          this.scale.get()(modifiedEvents[event.id].endTime) -
          this.scale.get()(modifiedEvents[event.id].startTime)
      )

  _moveHandles = modifiedEvents =>
    this.getRectHandle()
      .filter(
        handleData =>
          this.eventSelection.contains(handleData.id) &&
          (!this._getTarget().time ||
            handleData.time === this._getTarget().time)
      )
      .attr('cx', handleData =>
        this.scale.get()(modifiedEvents[handleData.id][handleData.time])
      )

  _getRescheduledEvents = xCoord => {
    switch (this._getTarget().time) {
      case 'startTime':
        return this._changeStart(xCoord)
      case 'endTime':
        return this._changeEnd(xCoord)
      default:
        return this._schiftEvent(xCoord)
    }
  }

  _schiftEvent = xCoord =>
    this.eventSelection.get().reduce((result, event) => {
      result[event.id] = {
        startTime: this._getNewTime(xCoord, event.startTime),
        endTime: this._getNewTime(xCoord, event.endTime)
      }
      return result
    }, {})

  _changeStart = xCoord =>
    this.eventSelection.get().reduce((result, event) => {
      const newStart = this._getNewTime(xCoord, event.startTime)
      result[event.id] = {
        startTime:
          differenceInMinutes(event.endTime, newStart) < this.minEventDuration
            ? subMinutes(event.endTime, this.minEventDuration)
            : newStart,
        endTime: event.endTime
      }
      return result
    }, {})

  _changeEnd = xCoord =>
    this.eventSelection.get().reduce((result, event) => {
      const newEnd = this._getNewTime(xCoord, event.endTime)
      result[event.id] = {
        startTime: event.startTime,
        endTime:
          differenceInMinutes(newEnd, event.startTime) < this.minEventDuration
            ? addMinutes(event.startTime, this.minEventDuration)
            : newEnd
      }
      return result
    }, {})

  _getNewTime = (xCoord, currentTime) => {
    const newX =
      xCoord +
      this.scale.get()(currentTime) -
      this.scale.get()(this._getTarget().startTime) -
      this._getDragAnchorPoint()
    return this.scale.get().invert(newX)
  }
}

export { RescheduleEvent }
