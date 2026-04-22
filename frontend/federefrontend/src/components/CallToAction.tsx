import "./CallToAction.css";

const CallToAction = () => {
  return (
    <section className="cta" aria-label="Appel à action">
      <div className="cta-content">
        <h2>Prêt à moderniser votre gestion médicale ?</h2>
        <p>
          Rejoignez les centaines de cliniques et laboratoires qui ont déjà
          transformé leur pratique médicale avec notre solution complète.
        </p>

        <div className="cta-badges">
          <span>Installation gratuite</span>
          <span>Support 24/7</span>
          <span>Formation incluse</span>
          <span>Sans engagement</span>
        </div>

        <form className="cta-form">
          <button type="button" className="cta-button">
            Commencer gratuitement <span aria-hidden="true">→</span>
          </button>
          <input type="email" placeholder="Votre email professionnel" />
        </form>

        <div className="cta-footnote">
          <span>✓ Aucune carte de crédit requise</span>
          <span>✓ Conforme RGPD</span>
          <span>✓ Données sécurisées</span>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
