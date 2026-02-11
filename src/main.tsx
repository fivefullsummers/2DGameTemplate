import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import loadingElephants from './assets/misc/loading-elephants.png'

// Preload loading-screen elephant so it appears as soon as bars fill (no delay)
const preload = new Image()
preload.src = loadingElephants as string

createRoot(document.getElementById('root')!).render(<App />)
