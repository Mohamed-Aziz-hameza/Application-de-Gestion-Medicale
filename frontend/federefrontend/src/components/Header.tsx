import "./Header.css";
import logo from "../assets/logo.png";

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <img className="header-logo" src={logo} alt="MediCare+" />
        <div>
          <h3>MediCare+</h3>
          <span>Gestion Médicale</span>
        </div>
      </div>

      <nav className="header-nav">
        <a href="#accueil">Accueil</a>
        <a href="#fonctionnalites">Fonctionnalités</a>
        <a href="#profils">Profils</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
};

export default Header;
