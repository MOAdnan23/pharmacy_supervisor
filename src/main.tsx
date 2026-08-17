/**
 * نقطة دخول التطبيق (Entry Point)
 *
 * مثل main() في لغات أخرى:
 * 1) نجد العنصر #root في HTML
 * 2) نطلب من React أن يرسم مكوّن <App /> داخله
 *
 * StrictMode: يساعد في التطوير على اكتشاف مشاكل مبكرة (يعمل مرتين في التطوير أحياناً).
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './features/auth/AuthContext'
import { FeedbackProvider } from './shared/feedback/FeedbackContext'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <FeedbackProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FeedbackProvider>
    </BrowserRouter>
  </StrictMode>,
)
