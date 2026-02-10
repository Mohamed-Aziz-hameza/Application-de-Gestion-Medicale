
import "./Profiles.css";

import medecinImg from "../assets/medecin.jpg";
import patientImg from "../assets/patient.jpg";
import adminImg from "../assets/administrateur.jpeg";
import { FaStethoscope, FaUser, FaUserShield } from "react-icons/fa";
import { Link } from "react-router-dom";

const profiles = [
  {
    title: "Médecins",
    label: "Médecins",
    tone: "tone-blue",
    icon: <FaStethoscope />, 
    subtitle: "Interface complète pour les professionnels de santé",
    bullets: [
      "Consultation des dossiers médicaux",
      "Gestion des rendez-vous médicaux",
      "Prescription et consultation des analyses",
      "Ajout de notes médicales",
      "Accès aux interprétations IA",
    ],
    primaryAction: "Connexion",
    secondaryAction: "Inscription",
    image: medecinImg,
    layout: "image-right",
  },
  {
    title: "Patients",
    label: "Patients",
    tone: "tone-pink",
    icon: <FaUser />, 
    subtitle: "Accès facile à vos informations médicales",
    bullets: [
      "Création et gestion de profil",
      "Consultation des rendez-vous",
      "Accès aux résultats d'analyses",
      "Consultation du dossier médical",
      "Réception de notifications",
    ],
    primaryAction: "Connexion",
    secondaryAction: "Inscription",
    image: patientImg,
    layout: "image-left",
  },
  {
    title: "Administrateurs",
    label: "Administrateurs",
    tone: "tone-green",
    icon: <FaUserShield />, 
    subtitle: "Contrôle total de la plateforme",
    bullets: [
      "Gestion des utilisateurs",
      "Attribution des rôles et permissions",
      "Supervision du système",
      "Maintenance et sécurité",
      "Rapports et statistiques",
    ],
    primaryAction: "Connexion",
    image: adminImg,
    layout: "image-right",
  },
];

import { useNavigate } from "react-router-dom";


const Profiles = () => {
  const navigate = useNavigate();

  const handleAction = (profile: any, action: string) => {
    if (profile.title === "Médecins") {
      if (action === "Connexion") navigate("/doctor-login");
      if (action === "Inscription") navigate("/doctor-register");
    } else if (profile.title === "Patients") {
      if (action === "Connexion") navigate("/patient-login");
      if (action === "Inscription") navigate("/patient-register");
    } else if (profile.title === "Administrateurs") {
      if (action === "Connexion") navigate("/admin-login");
    }
  };

  return (
    <section className="profiles" id="profils">
      <span className="profiles-pill">Profils utilisateurs</span>
      <h2>
        Une interface adaptée à <span>chaque utilisateur</span>
      </h2>
      <p className="profiles-subtitle">
        Trois espaces dédiés pour répondre aux besoins spécifiques de chaque profil
      </p>
      <div className="profiles-panels">
        {profiles.map((profile) => (
          <article
            className={`profile-panel ${profile.layout} ${profile.tone}`}
            key={profile.title}
          >
            <div className="profile-content">
              <span className={`profile-pill ${profile.tone}`}>
                {profile.icon} {profile.label}
              </span>
              <p className="profile-subtitle-text">{profile.subtitle}</p>
              <ul className="profile-list">
                {profile.bullets.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="profile-actions">
                {profile.primaryAction && (
                  <button
                    className="profile-button primary"
                    onClick={() => handleAction(profile, profile.primaryAction)}
                  >
                    {profile.primaryAction}
                  </button>
                )}
                {profile.secondaryAction && (
                  <button
                    className="profile-button outline"
                    onClick={() => handleAction(profile, profile.secondaryAction)}
                  >
                    {profile.secondaryAction}
                  </button>
                )}
              </div>
            </div>
            <div className="profile-image">
              <img src={profile.image} alt={profile.title} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};



export default Profiles;
