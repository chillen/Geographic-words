function startExploring() {
  let keywords = document.querySelector('form input').value.split(' ')
  window.fetch('/search',
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin', // NEEDED FOR SESSION COOKIES
      method: 'POST',
      body: JSON.stringify({fields: {}, keywords: keywords})
    })
    .then(res => res.json())
    .then(words => setupLists(words))
}

function nextWords() {
  let accepted = Array.prototype.slice.call(document.querySelectorAll('.accept')).map(el=>el.innerHTML)
  let rejected = Array.prototype.slice.call(document.querySelectorAll('.reject')).map(el=>el.innerHTML)

  window.fetch('/next',
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      method: 'POST',
      body: JSON.stringify({accept: accepted, reject: rejected})
    })
    .then(res => res.json())
    .then(words => setupLists(words))
}

function setupLists(words) {
  let form = document.querySelector('form')
  form.style.display = 'none'
  let ul = document.querySelector('ul')
  ul.style.display = 'block'
  let next = document.querySelector('button.next')
  next.style.display = 'block'
  next.onclick = nextWords

  while (ul.firstChild) {
    ul.removeChild(ul.firstChild)
  }

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