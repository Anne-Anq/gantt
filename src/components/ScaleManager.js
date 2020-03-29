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

  get = () =>
    this.transformEvent ? this.transformEvent.rescaleX(this.scale) : this.scale

  zoom = transformEvent => this._setTransformEvent(transformEvent)

  resize = newRange => {
    const transformEvent = this._getTransformEvent()
    if (transformEvent) {
      this._setScale(transformEvent.rescaleX(this._getScale()))
      this._setTransformEvent(undefined)
    }
    this._setRange(newRange)
  }
}

export { ScaleManager }
