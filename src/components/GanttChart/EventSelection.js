class EventSelection {
  constructor() {
    this.selectedEvents = []
    this.formats = []
  }

  _setFormats = formats => (this.formats = formats)

  _getFormats = () => this.formats

  _set = selectedEvents => (this.selectedEvents = selectedEvents)

  get = () => this.selectedEvents

  contains = eventId => !!this.get().find(({ id }) => id === eventId)

  containsOnly = eventId => this.contains(eventId) && this.get().length === 1

  add = event => {
    this._set([...this.get(), event])
    this.formatSelectedEvents()
  }

  setOnly = event => {
    this._set([event])
    this.formatSelectedEvents()
  }

  remove = event => {
    this._set(this.get().filter(({ id }) => id !== event.id))
    this.formatSelectedEvents()
  }

  reset = () => {
    this._set([])
    this.formatSelectedEvents()
  }

  addFormat = format => {
    this._setFormats([...this._getFormats(), format])
  }

  formatSelectedEvents = () => {
    this._getFormats().forEach(format => {
      format.selected(format.node.filter(({ id }) => this.contains(id)))
      format.unselected(format.node.filter(({ id }) => !this.contains(id)))
    })
  }

  handleClick = (event, isCtrlKeyDown) => {
    if (!isCtrlKeyDown) {
      if (this.containsOnly(event.id)) {
        this.remove(event)
      } else {
        this.setOnly(event)
      }
    } else {
      if (this.contains(event.id)) {
        this.remove(event)
      } else {
        this.add(event)
      }
    }
  }
}

export { EventSelection }
