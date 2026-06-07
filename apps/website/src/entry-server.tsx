import { renderToString } from 'react-dom/server'
import { App, getPageMeta } from './App'

export { getPageMeta }

export function render(pathname = '/') {
  return renderToString(<App pathname={pathname} />)
}
