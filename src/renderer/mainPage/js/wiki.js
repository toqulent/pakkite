const axios = require('axios')

const state = require('./state.js').state

// https://gomakethings.com/finding-the-next-and-previous-sibling-elements-that-match-a-selector-with-vanilla-js/
function getPreviousSibling (elem, selector) {
  // If the sibling matches our selector, use it
  // If not, jump to the next sibling and continue the loop
  var sibling = elem.previousElementSibling
  while (sibling) {
    if (sibling.matches(selector)) return sibling
    sibling = sibling.previousElementSibling
  }
}

function scrollIdIntoView (id, bound) {
  // https://stackoverflow.com/questions/3813294/how-to-get-element-by-innertext
  const tdTags = document.getElementById('iframe').contentDocument.getElementsByTagName('td')
  const searchRegex = new RegExp(`^<tr>\n<td( rowspan="[0-9]*")?>${id.toUpperCase().split('0X').join('0x')}\n<\/td>\n(<td( rowspan="[0-9]*")?>Play\n<\/td>\n)?<td( rowspan="[0-9]*")?>(${bound === 'serverbound' ? 'Server' : 'Client'}|Server &amp; Client)\n<\/td>`, 'm')
  let found

  for (var i = 0; i < tdTags.length; i++) {
    if (tdTags[i].parentElement.outerHTML.match(searchRegex)) {
      found = tdTags[i]
      break
    }
  }
  getPreviousSibling(found.closest('table'), 'h4').scrollIntoView()
}

exports.scrollWikiToCurrentPacket = function (packet) {
  if (!packet) {
    return
  }
  try {
    scrollIdIntoView(packet.hexIdString, packet.direction)
  } catch (err) {
    console.error(err)
  }
}

function fillWiki () {
  let data
  axios.get(state.proxyCapabilities.wikiVgPage).then((response) => {
    data = response.data
    // Allow it to load properly
    data = data
      .split('/images/')
      .join('https://wiki.vg/images/')
      .split('/resources/assets/')
      .join('https://wiki.vg/resources/assets/')
      .split('/load.php?')
      .join('https://wiki.vg/load.php?')

    // TODO: Break or modify links?
    document.getElementById('iframe').contentWindow.document.write(data)

    const style = document.createElement('style')

    style.innerHTML =
      `::-webkit-scrollbar {
           width: 17px;
       }
       
       ::-webkit-scrollbar-thumb {
           background: rgba(0, 0, 0, 0.3);
           border-radius: 10px;
       }
       ::-webkit-scrollbar-track {
           background: rgba(0, 0, 0, 0.2);
           border-radius: 10px;
       }
       
       ::-webkit-scrollbar-thumb:hover {
         background: rgba(0, 0, 0, 0.5);
       }
       
       ::-webkit-scrollbar-corner {
         background: #242424;
       }
       
       /* Cut off the left panel */
       #content, #left-navigation {
         margin-left: 0;
       }
       
       #mw-panel {
         display: none;
       }
       `

    document.getElementById('iframe').contentDocument.head.appendChild(style)
  })
}

exports.setup = function () {
  if (state.proxyCapabilities.wikiVgPage) {
    fillWiki()
  } else {
    document.getElementById('wiki-button').style.display = 'none'
  }
}
