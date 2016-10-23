# Simple functional Web Components

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
<badger>
  <div>${attrs => attrs.name}</div>
  <div>
    ${attrs => {
      if (attrs.name === 'Honey') return "Don't give a what?"
    }}
  </div>
</badger>
`
```

```html
<badger name="Honey" />
<badger name="Badgey" />
```

Ends up creating a full DOM of.

```html
<badger>
  <div>Honey</div>
  <div>Don't give a what?</div>
</badger>
<badger>
  <div>Badgey</div>
</badger>
```

You can set properties in the future and trigger a diff'd updated (like React).

```javascript
document.querySelector('badger').set('name', 'Not Honey')
```

Would change:

```html
<badger>
  <div>Honey</div>
  <div>Don't give a what?</div>
</badger>
```

To:

```html
<badger>
  <div>Not Honey</div>
</badger>
```

Constructors are supported as well:

```javascript
// You can also add constructors
shaolin`
${ element => console.log('Called during construction.') }
<badger>
  <div>${attrs => attrs.name}</div>
</badger>
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
<badger></badger>
`
document.querySelector('badger').set('nickname', 'asdf')
```

Also, the return value is the constructor. So you can subclass to create new
components like so.

```javascript

const Badger = shaolin`<badger></badger>`

const MyBadger extends Badger {}
shaolin.define('my-badger', MyBadger)
```

You can also define Shadow DOM after the custom element.

