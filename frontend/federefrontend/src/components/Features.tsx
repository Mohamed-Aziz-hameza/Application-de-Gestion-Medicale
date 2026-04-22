import "./Features.css";

const features = [
  {
    title: "Gestion des Patients",
    description:
      "Centralisez toutes les informations de vos patients, historique médical et consultations dans un système unique et sécurisé.",
    icon: "👥",
    tone: "tone-blue",
  },
  {
    title: "Rendez-vous Intelligents",
    description:
      "Planifiez et gérez les rendez-vous facilement. Notifications automatiques pour patients et médecins.",
    icon: "📅",
    tone: "tone-pink",
  },
  {
    title: "Analyses Médicales",
    description:
      "Enregistrement et suivi des analyses avec historique complet. Accès rapide aux résultats et interprétations.",
    icon: "🧪",
    tone: "tone-green",
  },
  {
    title: "Dossiers Médicaux Numériques",
    description:
      "Dossiers médicaux complets et sécurisés. Consultation instantanée des antécédents et notes médicales.",
    icon: "📄",
    tone: "tone-orange",
  },
  {
    title: "Intelligence Artificielle",
    description:
      "Analyse automatique des résultats médicaux, détection de valeurs anormales et suggestions IA.",
    icon: "🧠",
    tone: "tone-purple",
  },
  {
    title: "Tableaux de Bord",
    description:
      "Visualisez toutes vos données importantes en un coup d'œil.",
    icon: "🔳",
    tone: "tone-blue",
  },
  {
    title: "Sécurité Maximale",
    description:
      "Protection avancée des données médicales avec chiffrement, accès sécurisé et sauvegardes automatiques.",
    icon: "🛡️",
    tone: "tone-pink",
  },
  {
    title: "Multi-plateforme",
    description:
      "Interface responsive accessible sur PC, tablette et smartphone.",
    icon: "📱",
    tone: "tone-green",
  },
];

const Features = () => {
  return (
    <section className="features" id="fonctionnalites">
      <span className="features-pill">Fonctionnalités complètes</span>
      <h2>
        Tout ce dont vous avez besoin pour <span>gérer votre clinique</span>
      </h2>
      <p className="features-subtitle">
        Une solution complète qui répond à tous les besoins de gestion médicale moderne
      </p>

      <div className="features-grid">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className={`feature-top ${f.tone}`}>
              <span className="feature-icon">{f.icon}</span>
            </div>
            <h3 className="feature-title">{f.title}</h3>
            <p>{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
