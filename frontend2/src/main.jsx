import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'react-toastify/dist/ReactToastify.css';
import { AdminContextProvider } from './adminPannel/context/context.jsx';
import { BrowserRouter } from 'react-router-dom';
import { HomeContextProvider } from './Home/context/context.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AdminContextProvider>
        <HomeContextProvider>
          <App />
        </HomeContextProvider>
      </AdminContextProvider>
    </BrowserRouter>
  </StrictMode>,
)
