# Simple Functional Web Components

You can easily define new custom elements with constructors,
reactive rendering functions, and Shadow DOM.

Let's take a quick look at all the features.

```javascript
const shaolin = require('shaolin')

shaolin`
${ elem => { /* constructor */ } }
<test-all-features>
  <div>${ attrs => {
    /* Function within the custom element fire whenever
       the model properties change and when instantiated.
       Any element properties will be used as the intitial model
       attributes.
    */
    return attrs.message
  }}
  </div>
</test-all-features>
<!-- Shadow DOM -->
<style>
  :host {
    padding: 100px;
    ${ elem => {
      /* Functions in the Shadow DOM are also fired during construction. */
      return 'margin: 10px;'
    }}
  }
</style>
<div>
  <span>shadow content</span>
</div>
<slot></slot>
`
```

Now let's back up and look at a simpler example.

```javascript
const shaolin = require('shaolin')

shaolin`
<badger-element>
  <div>${attrs => attrs.name}</div>
  <div>
    ${attrs => {
      if (attrs.name === 'Honey') return "Don't give a what?"
    }}
  </div>
</badger-element>
`
```

```html
<badger-element name="Honey" />
<badger-element name="Badgey" />
```

Ends up creating a full DOM of.

```html
<badger-element>
  <div>Honey</div>
  <div>Don't give a what?</div>
</badger-element>
<badger-element>
  <div>Badgey</div>
</badger-element>
```

You can set properties in the future and trigger a diff'd updated (like React).

```javascript
document.querySelector('badger-element').set('name', 'Not Honey')
```

Would change:

```html
<badger-element>
  <div>Honey</div>
  <div>Don't give a what?</div>
</badger-element>
```

To:

```html
<badger-element>
  <div>Not Honey</div>
</badger-element>
```

Constructors are supported as well:

```javascript
// You can also add constructors
shaolin`
${ element => console.log('Called during construction.') }
<badger-element>
  <div>${attrs => attrs.name}</div>
</badger-element>
`
```

Elements are also the models for their own data. Setting properties
will trigger `on` events.

```javascript
shaolin`
${ element => {
  element.on('nickname', value => {
    // Called only when this property is set or changed.
    console.log(value)
  })
} }
<badger-element></badger-element>
`
document.querySelector('badger-element').set('nickname', 'asdf')
```

Also, the return value is the constructor. So you can subclass to create new
components like so.

```javascript

const Badger = shaolin`<badger-element></badger-element>`

const MyBadger extends Badger {}
shaolin.define('my-badger', MyBadger)
```

You can also define Shadow DOM after the custom element.

## API

### element.set(key, value[, noUpdate])

Set a property on the component.

While initial values tend to be set by the element attributes it is often
necessary to set values programatically or set complex values in JavaScript.

Third optional property suppresses an update of the components contents by
calling all the dynamic functions and performing a DOM diff.

### element.get(key)

Return a model property from the component.

### element.on(key, callback)

Attach an event listener for when a model property is set or updated.

This is particular useful to use in the contructor before any model properties
are ever set.

### Special properties

#### 'connected'

Set when the component is added or removed from the DOM.

```javascript
let TestConnected = shaolin`
${ elem => elem.on('connected', () => console.log('connected')) }
<test-connected>
</test-connected>
`
let el = new TestConnected()
console.log('created')
document.body.appendChild(el)
// Will now print "connected"
```