import "./Hero.css";
import hero from "../assets/hero.jpg.jpeg";

const Hero = () => {
  return (
    <section className="hero" id="accueil">
      <div className="hero-text">
        <span className="badge">⚡ Solution complète de gestion médicale</span>

        <h1>
          Gérez votre <span>établissement</span>
          <br />
          <span>médical</span> en toute simplicité
        </h1>

        <p>
          Une plateforme moderne et sécurisée pour la gestion des patients,
          rendez-vous, analyses médicales et dossiers numériques.
        </p>

       

        <div className="hero-stats">
          <div>
            <strong>100%</strong>
            <span>Sécurisé</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Disponible</span>
          </div>
          <div>
            <strong>IA</strong>
            <span>Intégrée</span>
          </div>
        </div>

        <div className="hero-trust">
        
          <div className="trust-item">❤️ Approuvé par les professionnels</div>
        </div>
      </div>

      <div className="hero-image">
        <img src={hero} alt="Clinique" />
      </div>
    </section>
  );
};

export default Hero;
