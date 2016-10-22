/* globals HTMLElement, customElements, MutationObserver */
const funky = require('../funky')
const yo = require('yo-yo')
const assign = require('lodash.assign')

function attributes (elem) {
  let attrs = {}
  for (var i = 0; i < elem.attributes.length; i++) {
    var node = elem.attributes[i]
    attrs[node.nodeName] = node.nodeValue
  }
  return attrs
}

function parse (strings, values) {
  // The raw arrays are no actually mutable, copy.
  strings = strings.slice()
  values = values.slice()

  let result = {constructors: [], destructors: []}
  let s = strings.join('').replace(/ /g, '')
  let name = s.slice(s.indexOf('<') + 1, s.indexOf('>'))
  let opener = `<${name}>`
  let closer = `</${name}>`

  // Parse constructors from beginning.
  let i = 0
  while (i === 0) {
    let str = strings[i].replace(/ /g, '')
    if (str.indexOf(opener) !== -1) {
      strings[i] = strings[i].replace(name, 'template')
      i += 1
    } else {
      strings.shift()
      result.constructors.push(values.shift())
    }
  }
  // Parse desctructors from end.
  i = strings.length - 1
  while (i === (strings.length - 1)) {
    let str = strings[i].replace(/ /g, '')
    if (str.indexOf(closer) !== -1) {
      let ls = strings[i]
      let pos = ls.lastIndexOf(name)
      strings[i] = ls.slice(0, pos) +
                   'template' +
                   ls.slice(pos + name.length)
      i += 1
    } else {
      strings.pop()
      result.destructors.push(values.pop())
      i -= 1
    }
  }
  // TODO: type checking on constructors and destructors

  result.name = name
  result.s = s
  result.strings = strings
  result.values = values
  return result
}

function shaolin (strings, ...values) {
  let parsed = parse(strings, values)
  let view = funky(parsed.strings, ...parsed.values)
  let ShaolinElement = class extends HTMLElement {
    constructor (self) {
      self = super(self)
      self.constructing = true
      self.view = view
      self.db = attributes(this)
      self.eventCallbacks = {}
      self.constructors = parsed.constructors
      self.destructors = parsed.destructors

      self.constructors.forEach(c => c(self))

      // Call on methods for initial values.
      for (let key in self.db) {
        self.emit(key, self.db[key])
      }

      self.template = view(self.getAttributes())
      self.template.yoyoOpts.childrenOnly = true
      ;[...self.template.children].forEach(el => {
        self.appendChild(el)
      })
      self.constructing = false
    }

    connectedCallback () {
      this.set('connected', true)
    }

    disconnectedCallback () {
      this.destructors.forEach(c => c(this))
    }

    update () {
      let newel = this.template.processUpdate(this.getAttributes())
      yo.update(this, newel, {childrenOnly: true})
    }

    set (key, value) {
      if (typeof value === 'string' ||
          typeof value === 'boolean' ||
          typeof value === 'number' ||
          typeof value === 'undefined' ||
          value === null
          ) {
        this.setAttribute(key, value)
      }
      this.db[key] = value
      this.emit(key, value)
      if (!this.constructing) this.update()
    }

    get (key) {
      return this.db[key]
    }

    on (key, cb) {
      if (!this.eventCallbacks[key]) this.eventCallbacks[key] = []
      this.eventCallbacks[key].push(cb)
    }

    emit (key, value) {
      if (this.eventCallbacks[key]) {
        this.eventCallbacks[key].forEach(c => c(value))
      }
    }

    getAttributes () {
      return assign({}, this.db)
    }
  }
  shaolin.define(parsed.name, ShaolinElement)
  return ShaolinElement
}

if (process.browser) {
  window.shaolin = shaolin
}

module.exports = shaolin
module.exports.define = (name, cls) => customElements.define(name, cls)
