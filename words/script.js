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

function setupLists(words) {
    let form = document.querySelector('form')
    form.style.display = 'none'
    let ul = document.querySelector('ul')
    ul.style.display = 'block'
    for (let word of words) {
        let li = document.createElement('li')
        let btn = document.createElement('button')
        btn.innerHTML = word
        li.appendChild(btn)
        ul.appendChild(li)
    }
}