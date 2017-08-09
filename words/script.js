function startExploring() {
  let keywords = document.querySelector('form input').value.split(' ')
  window.fetch('/',
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({fields: {}, keywords: keywords})
    })
    .then(res => res.json())
    .then(words => setupLists(words))
}

function nextWords() {

}

function setupLists(words) {
  let form = document.querySelector('form')
  form.style.display = 'none'
  let ul = document.querySelector('ul')
  ul.style.display = 'block'
  let next = document.createElement('button')
  next.onclick = nextWords

  for (let word of words) {
    let li = document.createElement('li')
    let btn = document.createElement('button')
    btn.id = 'btn-'+word
    btn.classList.add('word')
    btn.onclick = function() {
      if (this.classList.contains('accept')) {
        this.classList.remove('accept')
        this.classList.add('reject')
      }
      else if (this.classList.contains('reject')) {
        this.classList.remove('reject')
      }
      else {
        this.classList.add('accept')
      }
      this.blur()
      return false
    }
    btn.innerHTML = word
    li.appendChild(btn)
    ul.appendChild(li)
  }
}

function toggleState(el) {

}