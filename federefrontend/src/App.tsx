import ProfilePage from './pages/ProfilePage'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏥 Application de Gestion Médicale</h1>
        <nav className="app-nav">
          <a href="#" className="nav-link active">Profil</a>
        </nav>
      </header>
      <main className="app-main">
        <ProfilePage />
      </main>
      <footer className="app-footer">
        <p>© 2026 Application Gestion Médicale - Tous droits réservés</p>
      </footer>
    </div>
  )
}

export default App
