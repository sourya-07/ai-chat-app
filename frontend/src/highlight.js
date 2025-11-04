import hljs from 'highlight.js'
import 'highlight.js/styles/nord.css'

hljs.configure({
  ignoreUnescapedHTML: true,
  languages: ['javascript', 'html', 'css', 'json', 'bash', 'python']
})

window.hljs = hljs

export default hljs