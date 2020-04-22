import * as d3 from 'd3'
import { startOfDay, endOfDay } from 'date-fns'

class ScaleManager {
  constructor() {
    this.today = new Date()
    this.scale = d3
      .scaleTime()
      .domain([startOfDay(this.today), endOfDay(this.today)])
    this.transformEvent = undefined
  }

  _setScale = newScale => (this.scale = newScale)

  _getScale = () => this.scale

  _setTransformEvent = transformEvent => (this.transformEvent = transformEvent)

  _getTransformEvent = () => this.transformEvent

  _setRange = newRange => this._setScale(this._getScale().range(newRange))

  get = () => this._getScale()

  revertedZoomScale = () => {
    return this._getScale()
      .copy()
      .domain(
        this._getScale()
          .range()
          .map(this._getTransformEvent().applyX, this._getTransformEvent())
          .map(this._getScale().invert)
      )
  }

  zoom = transformEvent => {
    const unZoomedScale = this._getTransformEvent()
      ? this.revertedZoomScale()
      : this._getScale()
    this._setTransformEvent(transformEvent)
    this._setScale(transformEvent.rescaleX(unZoomedScale))
  }

  resize = newRange => {
    this._setRange(newRange)
  }

  getTimeBoundaries = () => {
    return this.get()
      .range()
      .map(xCoord => this.get().invert(xCoord))
  }
}

export { ScaleManager }
