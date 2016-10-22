


```javascript
const shaolin = require('shaolin')

shaolin`
<badger>
  <div>${attrs => attrs.name}</div>
  ${attrs => {
    if (attrs.name === 'Honey') return "<div>Don't give a what?</div>"
  }}
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

```javascript
// You can also add constructors
shaolin`
${ element => console.log('Called during construction.') }
${ element => {
  element.onProperty('nickname', value => {
    // Called only when this property is set or changed.
    console.log(value)
  })
} }
<badger>
  <div>${attrs => attrs.name}</div>
</badger>
`

document.querySelector('badger').setAttribute('nickname', 'asdf')
```