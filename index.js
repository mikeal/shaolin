/* globals HTMLElement, customElements */
const funky = require('../funky')
const yo = require('yo-yo')
const assign = require('lodash.assign')
const bel = require('bel')

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
  let shadowStrings = []
  let shadowValues = []
  let elementStrings = []
  let elementValues = []
  let constructors = []
  let s = strings.join('').replace(/ /g, '')
  let name = s.slice(s.indexOf('<') + 1, s.indexOf('>'))

  let fullstring = ''
  let valueMap = {}

  let i = 0
  while (i < strings.length) {
    fullstring += strings[i]
    valueMap[fullstring.length + '-' + i] = values[i]
    i++
  }

  let opener = `<${name}>`
  let openPos = fullstring.indexOf(opener)
  let closer = `</${name}>`
  let closePos = fullstring.lastIndexOf(closer)

  if (openPos === -1) throw new Error('Cannot find open position.')
  if (closePos === -1) throw new Error('Cannot find close position.')

  for (let posName in valueMap) {
    let pos = +posName.slice(0, posName.indexOf('-'))
    let val = valueMap[posName]

    if (pos < openPos) constructors.push(val)
    else if (pos > openPos && pos < closePos) {
      elementValues.push(val)
    } else if (pos > closePos) {
      shadowValues.push(val)
    } else {
      throw new Error('Parser error, cannot assign value.')
    }
  }

  i = 0
  let pos = 0
  while (i < strings.length) {
    let str = strings[i]

    let iter = () => {
      if (pos >= fullstring.length) return
      if (pos >= openPos) {
        if (pos > closePos) {
          shadowStrings.push(str)
        } else {
          if (str.indexOf(closer) !== -1) {
            let _pos = str.indexOf(closer) + closer.length + 1
            elementStrings.push(str.slice(0, _pos))
            str = str.slice(_pos)
            pos += _pos
            return iter()
          } else {
            elementStrings.push(str)
          }
        }
      } else {
        if (str.indexOf(opener) !== -1) {
          let _pos = str.indexOf(opener)
          str = str.slice(_pos)
          pos = pos + _pos
          return iter()
        }
      }
      pos = pos + str.length
    }
    iter()
    i++
  }

  elementStrings[0] = elementStrings[0].replace(opener, '<template>')
  let _len = elementStrings.length - 1
  elementStrings[_len] = elementStrings[_len].replace(closer, '</template>')

  // TODO: type checking on constructors and destructors

  let result = {
    name,
    constructors,
    shadowStrings,
    shadowValues,
    elementStrings,
    elementValues
  }
  return result
}

function mergeStrings (arr1, arr2) {
  let str = ''
  let i = 0
  while (i !== arr1.length) {
    str += `${arr1[i]}${arr2[i]}`
    i++
  }
  return str
}

function shaolin (strings, ...values) {
  let parsed = parse(strings, values)
  if (parsed.name.indexOf('-') === -1) {
    throw new Error('Custom element names must include a "-" character.')
  }
  let view = funky(parsed.elementStrings, ...parsed.elementValues)
  let ShaolinElement = class extends HTMLElement {
    constructor (self) {
      self = super(self)
      self.constructing = true
      self.view = view
      self.eventCallbacks = {}
      self.constructors = parsed.constructors
      self.destructors = parsed.destructors

      self.constructors.forEach(c => c(self))

      /* Init properties into the Model */
      self.db = attributes(self)
      for (let key in self.db) {
        self.emit(key, self.db[key])
      }

      if (parsed.shadowStrings.length) {
        let parsedValues = parsed.shadowValues.map(v => {
          if (typeof v === 'function') return v(self) || ''
          if (!v) return ''
          return v
        })
        let shadowHTML = mergeStrings(parsed.shadowStrings, parsedValues)
        if (shadowHTML.replace(/ /g, '').length) {
          self.attachShadow({mode: 'open'}).innerHTML = shadowHTML
        }
      }

      // Call on methods for initial values.
      for (let key in self.db) {
        self.emit(key, self.db[key])
      }

      self.template = view(self.getAttributes())
      self.template.yoyoOpts.childrenOnly = true
      yo.update(this, self.template, {childrenOnly: true})
      self.constructing = false
    }

    connectedCallback () {
      this.set('connected', true, true)
    }

    disconnectedCallback () {
      this.set('connected', false, true)
    }

    update () {
      let newel = this.template.processUpdate(this.getAttributes())
      yo.update(this, newel, {childrenOnly: true})
    }

    set (key, value, noUpdate) {
      if (!db) {
        let msg = `Cannot get properties until construction is finished, use \`elem.on('${key}', callback)\` instead.`
        throw new Error(msg)
      }
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
      if (!this.constructing && !noUpdate) this.update()
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
