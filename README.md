


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
