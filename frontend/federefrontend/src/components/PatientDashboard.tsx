import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaFileMedical,
  FaCalendarAlt,
  FaSignOutAlt,
  FaPlus,
  FaBan,
  FaTimes,
  FaNotesMedical,
  FaPrescriptionBottle,
  FaClock,
  FaBell,
  FaStethoscope,
  FaVials,
} from "react-icons/fa";
import {
  getUser,
  logout,
  getMyDossierMedical,
  getPatientRendezVous,
  createRendezVous,
  cancelRendezVous,
  getAllMedecins,
  getAvailableSlotsForMedecinDate,
  getMyNotifications,
  getMyUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getPatientAnalyses,
  type DossierMedicalDTO,
  type RendezVousDTO,
  type UtilisateurResponseDTO,
  type CreateRendezVousRequest,
  type DisponibiliteDTO,
  type NotificationDTO,
  type AnalyseResultatDTO,
} from "../services/api";
import "./PatientDashboard.css";

const tabs = [
  { key: "dossier", label: "Mon Dossier Médical", icon: <FaFileMedical /> },
  { key: "rdv", label: "Mes Rendez-vous", icon: <FaCalendarAlt /> },
  { key: "analyses", label: "Analyses & Resultats", icon: <FaVials /> },
  { key: "profile", label: "Mon Profil", icon: <FaUser /> },
];

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [activeTab, setActiveTab] = useState("dossier");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Data states
  const [dossier, setDossier] = useState<DossierMedicalDTO | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVousDTO[]>([]);
  const [medecins, setMedecins] = useState<UtilisateurResponseDTO[]>([]);
  const [availableSlots, setAvailableSlots] = useState<DisponibiliteDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [analyses, setAnalyses] = useState<AnalyseResultatDTO[]>([]);
  const [selectedAnalyseId, setSelectedAnalyseId] = useState<number | null>(null);

  // Modal state
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvForm, setRdvForm] = useState<CreateRendezVousRequest>({ medecinId: 0, disponibiliteId: 0, dateRdv: "", heureRdv: "", motif: "" });

  useEffect(() => {
    if (!user || user.role !== "ROLE_PATIENT") {
      navigate("/patient-login", { replace: true });
    }
  }, []);

  useEffect(() => {
    if (activeTab === "dossier") loadDossier();
    if (activeTab === "rdv") { loadRendezVous(); loadMedecins(); loadNotifications(); }
    if (activeTab === "analyses") { loadAnalyses(); loadNotifications(); }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  const showNotif = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadDossier = async () => {
    try {
      const data = await getMyDossierMedical();
      setDossier(data);
    } catch {
      setDossier(null);
    }
  };

  const loadRendezVous = async () => {
    try {
      const data = await getPatientRendezVous();
      setRendezVous(data);
    } catch {
      setRendezVous([]);
    }
  };

  const loadMedecins = async () => {
    try {
      const data = await getAllMedecins();
      setMedecins(data);
    } catch {
      setMedecins([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const [n, c] = await Promise.all([getMyNotifications(), getMyUnreadNotificationCount()]);
      setNotifications(n);
      setUnreadNotifCount(c.unread || 0);
    } catch {
      setNotifications([]);
      setUnreadNotifCount(0);
    }
  };

  const loadAnalyses = async () => {
    try {
      const data = await getPatientAnalyses();
      setAnalyses(data);
      if (data.length > 0 && selectedAnalyseId == null) {
        setSelectedAnalyseId(data[0].id);
      }
    } catch {
      setAnalyses([]);
      setSelectedAnalyseId(null);
    }
  };

  const handleOpenNotificationCenter = async () => {
    const next = !showNotificationCenter;
    setShowNotificationCenter(next);
    if (next) {
      try {
        if (unreadNotifCount > 0) {
          await markAllNotificationsAsRead();
        }
      } catch {
        // Keep panel open even if mark-all fails.
      }
      await loadNotifications();
    }
  };

  const handleReadNotification = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch {
      showNotif("error", "Erreur notification");
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch {
      showNotif("error", "Erreur notification");
    }
  };

  const loadAvailableSlots = async (medecinId: number, date: string) => {
    if (!medecinId || !date) {
      setAvailableSlots([]);
      return;
    }
    try {
      const slots = await getAvailableSlotsForMedecinDate(medecinId, date);
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleCreateRdv = async () => {
    if (!rdvForm.medecinId || !rdvForm.dateRdv || !rdvForm.disponibiliteId || !rdvForm.motif) {
      showNotif("error", "Veuillez remplir tous les champs");
      return;
    }
    try {
      await createRendezVous(rdvForm);
      showNotif("success", "Rendez-vous créé avec succès !");
      setShowRdvModal(false);
      setRdvForm({ medecinId: 0, disponibiliteId: 0, dateRdv: "", heureRdv: "", motif: "" });
      setAvailableSlots([]);
      loadRendezVous();
      loadNotifications();
    } catch {
      showNotif("error", "Erreur lors de la création");
    }
  };

  const handleCancelRdv = async (id: number) => {
    try {
      await cancelRendezVous(id);
      showNotif("success", "Rendez-vous annulé");
      loadRendezVous();
      loadNotifications();
    } catch {
      showNotif("error", "Erreur lors de l'annulation");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Counts for badges
  const pendingRdvCount = rendezVous.filter(r => r.statut === "EN_ATTENTE").length;
  const selectedAnalyse = analyses.find((a) => a.id === selectedAnalyseId) || null;

  return (
    <div className="pat-dash-root">
      {notification && (
        <div className={`pat-notification ${notification.type}`}>{notification.message}</div>
      )}

      {/* Sidebar */}
      <aside className="pat-sidebar">
        <div>
          <div className="pat-sidebar-brand">
            <div className="pat-sidebar-logo">
              <FaUser style={{ color: "#fff", fontSize: 26 }} />
            </div>
            <div>
              <div className="pat-sidebar-title">MediCare+</div>
              <div className="pat-sidebar-subtitle">Espace Patient</div>
            </div>
          </div>

          <nav className="pat-sidebar-nav">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`pat-sidebar-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon} {tab.label}
                {tab.key === "rdv" && pendingRdvCount > 0 && (
                  <span className="pat-badge">{pendingRdvCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="pat-sidebar-bottom">
          <div className="pat-sidebar-user">
            <div className="pat-sidebar-avatar">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div>
              <div className="pat-sidebar-user-name">{user?.prenom} {user?.nom}</div>
              <div className="pat-sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="pat-sidebar-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pat-main">
        <div className="pat-header">
          <div>
            <h1 className="pat-header-title">
              {activeTab === "dossier" && "Mon Dossier Médical"}
              {activeTab === "rdv" && "Mes Rendez-vous"}
              {activeTab === "analyses" && "Mes Analyses & Resultats"}
              {activeTab === "profile" && "Mon Profil"}
            </h1>
            <p className="pat-header-subtitle">
              Bienvenue, {user?.prenom} {user?.nom}
            </p>
          </div>
          <div className="pat-header-right">
            <div className="pat-notif-icon" onClick={handleOpenNotificationCenter}>
              <FaBell size={18} />
              {unreadNotifCount > 0 && <span className="pat-notif-badge">{unreadNotifCount}</span>}
            </div>
            <div className="pat-header-avatar">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            {showNotificationCenter && (
              <div className="pat-notif-panel">
                <div className="pat-notif-panel-head">
                  <strong>Notifications</strong>
                  <button className="pat-btn pat-btn-secondary" onClick={handleReadAllNotifications}>Tout lire</button>
                </div>
                <div className="pat-notif-panel-list">
                  {notifications.length === 0 && <p className="pat-dossier-empty">Aucune notification.</p>}
                  {notifications.slice(0, 12).map((n) => (
                    <button key={n.id} className={`pat-notif-item ${n.lu ? "read" : "unread"}`} onClick={() => handleReadNotification(n.id)}>
                      <div className="pat-notif-item-title">{n.titre}</div>
                      <div className="pat-notif-item-msg">{n.message}</div>
                      <div className="pat-notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pat-content">
          {/* ─── Dossier Médical Tab ─── */}
          {activeTab === "dossier" && (
            <div>
              {dossier ? (
                <div className="pat-dossier-card">
                  <div className="pat-dossier-header">
                    <FaFileMedical size={24} style={{ color: "#ec4899" }} />
                    <h2>Dossier Médical</h2>
                  </div>

                  <div className="pat-dossier-section">
                    <h4><FaNotesMedical /> Diagnostics</h4>
                    {dossier.diagnostics && dossier.diagnostics.length > 0 ? (
                      <ul className="pat-dossier-list">
                        {dossier.diagnostics.map((d, i) => (
                          <li key={i} className="pat-dossier-item diagnostic">{d}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pat-dossier-empty">Aucun diagnostic enregistré</p>
                    )}
                  </div>

                  <div className="pat-dossier-section">
                    <h4><FaPrescriptionBottle /> Prescriptions</h4>
                    {dossier.prescriptions && dossier.prescriptions.length > 0 ? (
                      <ul className="pat-dossier-list">
                        {dossier.prescriptions.map((p, i) => (
                          <li key={i} className="pat-dossier-item prescription">{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pat-dossier-empty">Aucune prescription enregistrée</p>
                    )}
                  </div>

                  {dossier.notesMedecin && (
                    <div className="pat-dossier-section">
                      <h4><FaStethoscope /> Notes du Médecin</h4>
                      <div className="pat-dossier-notes">{dossier.notesMedecin}</div>
                    </div>
                  )}

                  <div className="pat-dossier-section">
                    <h4>Antécédents</h4>
                    {dossier.antecedents && dossier.antecedents.length > 0 ? (
                      <ul className="pat-dossier-list">
                        {dossier.antecedents.map((a, i) => (
                          <li key={i} className="pat-dossier-item diagnostic">{a}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pat-dossier-empty">Aucun antécédent renseigné</p>
                    )}
                  </div>

                  <div className="pat-dossier-section">
                    <h4>Analyses</h4>
                    {dossier.analyses && dossier.analyses.length > 0 ? (
                      <ul className="pat-dossier-list">
                        {dossier.analyses.map((a, i) => (
                          <li key={i} className="pat-dossier-item prescription">{a}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pat-dossier-empty">Aucune analyse renseignée</p>
                    )}
                  </div>

                  <div className="pat-dossier-section">
                    <h4>Résultats</h4>
                    {dossier.resultats && dossier.resultats.length > 0 ? (
                      <ul className="pat-dossier-list">
                        {dossier.resultats.map((r, i) => (
                          <li key={i} className="pat-dossier-item diagnostic">{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pat-dossier-empty">Aucun résultat renseigné</p>
                    )}
                  </div>

                  <div className="pat-dossier-section">
                    <h4>Images médicales</h4>
                    {dossier.images && dossier.images.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                        {dossier.images.map((img) => (
                          <div key={img.id} style={{ border: "1px solid #fbcfe8", borderRadius: 10, padding: 8, background: "#fff" }}>
                            <img src={img.dataUrl} alt={img.fileName || "image medicale"} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{img.fileName || "Image medicale"}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="pat-dossier-empty">Aucune image renseignée</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pat-empty-state">
                  <FaFileMedical size={48} style={{ color: "#cbd5e1" }} />
                  <h3>Aucun dossier médical</h3>
                  <p>Votre médecin n'a pas encore créé votre dossier médical.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Rendez-vous Tab ─── */}
          {activeTab === "rdv" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button className="pat-btn pat-btn-primary" onClick={() => { setShowRdvModal(true); loadMedecins(); setRdvForm({ medecinId: 0, disponibiliteId: 0, dateRdv: "", heureRdv: "", motif: "" }); setAvailableSlots([]); }}>
                  <FaPlus /> Nouveau Rendez-vous
                </button>
              </div>

              {notifications.length > 0 && (
                <div className="pat-pending-section" style={{ marginBottom: 18 }}>
                  <h3><FaBell /> Notifications ({unreadNotifCount} non lues)</h3>
                  <div className="pat-rdv-cards">
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className="pat-rdv-card" style={{ borderLeft: n.lu ? "4px solid #94a3b8" : "4px solid #22c55e" }}>
                        <div className="pat-rdv-info">
                          <strong>{n.titre}</strong>
                          <span>{n.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending notifications */}
              {rendezVous.filter(r => r.statut === "EN_ATTENTE").length > 0 && (
                <div className="pat-pending-section">
                  <h3><FaBell /> En attente de confirmation</h3>
                  <div className="pat-rdv-cards">
                    {rendezVous.filter(r => r.statut === "EN_ATTENTE").map((rdv) => (
                      <div key={rdv.id} className="pat-rdv-card pending">
                        <div className="pat-rdv-info">
                          <strong>Dr. {rdv.medecinPrenom} {rdv.medecinNom}</strong>
                          <span><FaCalendarAlt /> {rdv.dateRdv} à {rdv.heureRdv}</span>
                          <span className="pat-rdv-motif">{rdv.motif}</span>
                        </div>
                        <div className="pat-rdv-actions">
                          <button className="pat-btn pat-btn-danger" onClick={() => handleCancelRdv(rdv.id)} title="Annuler">
                            <FaBan /> Annuler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rendezVous.length > 0 ? (
                <div className="pat-table-container">
                  <table className="pat-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Heure</th>
                        <th>Médecin</th>
                        <th>Spécialité</th>
                        <th>Motif</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rendezVous.map((rdv) => (
                        <tr key={rdv.id}>
                          <td>{rdv.dateRdv}</td>
                          <td><FaClock /> {rdv.heureRdv}</td>
                          <td>Dr. {rdv.medecinPrenom} {rdv.medecinNom}</td>
                          <td>{rdv.medecinSpecialite || "—"}</td>
                          <td>{rdv.motif}</td>
                          <td>
                            <span className={`pat-status-badge ${rdv.statut.toLowerCase()}`}>
                              {rdv.statut}
                            </span>
                          </td>
                          <td>
                            {(rdv.statut === "EN_ATTENTE" || rdv.statut === "CONFIRME") && (
                              <button className="pat-btn-icon danger" onClick={() => handleCancelRdv(rdv.id)} title="Annuler">
                                <FaBan />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pat-empty-state">
                  <FaCalendarAlt size={48} style={{ color: "#cbd5e1" }} />
                  <h3>Aucun rendez-vous</h3>
                  <p>Prenez votre premier rendez-vous avec un médecin.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Analyses Tab ─── */}
          {activeTab === "analyses" && (
            <div>
              {analyses.length > 0 ? (
                <>
                  <div className="pat-table-container" style={{ marginBottom: 16 }}>
                    <table className="pat-table">
                      <thead>
                        <tr>
                          <th>Analyse</th>
                          <th>Motif</th>
                          <th>Priorite</th>
                          <th>Type creation</th>
                          <th>Statut</th>
                          <th>Progression</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyses.map((a) => (
                          <tr key={a.id} onClick={() => setSelectedAnalyseId(a.id)} style={{ cursor: "pointer", background: selectedAnalyseId === a.id ? "#fdf2f8" : "transparent" }}>
                            <td>{a.typeAnalyse}</td>
                            <td>{a.motifClinique || "—"}</td>
                            <td>{a.priorite}</td>
                            <td>{a.creationTypeLabel || "Creee par un medecin"}</td>
                            <td><span className={`pat-status-badge ${(a.statut || "").toLowerCase()}`}>{a.statut}</span></td>
                            <td>{a.progression}%</td>
                            <td>{new Date(a.dateDemande).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedAnalyse && (
                    <div className="pat-dossier-card">
                      <div className="pat-dossier-header">
                        <FaVials size={22} style={{ color: "#ec4899" }} />
                        <h2>Timeline de suivi - {selectedAnalyse.typeAnalyse}</h2>
                      </div>
                      <div className="pat-dossier-section">
                        <h4>Type de creation</h4>
                        <div className="pat-dossier-notes">{selectedAnalyse.creationTypeLabel || "Creee par un medecin"}</div>
                      </div>
                      {selectedAnalyse.resultatValeur && (
                        <div className="pat-dossier-section">
                          <h4>Resultat</h4>
                          <div className="pat-dossier-notes">
                            {selectedAnalyse.resultatValeur} {selectedAnalyse.unite || ""}
                            {selectedAnalyse.intervalleReference ? ` (Ref: ${selectedAnalyse.intervalleReference})` : ""}
                          </div>
                        </div>
                      )}
                      {selectedAnalyse.interpretation && (
                        <div className="pat-dossier-section">
                          <h4>Interpretation</h4>
                          <div className="pat-dossier-notes">{selectedAnalyse.interpretation}</div>
                        </div>
                      )}
                      {selectedAnalyse.conclusion && (
                        <div className="pat-dossier-section">
                          <h4>Conclusion</h4>
                          <div className="pat-dossier-notes">{selectedAnalyse.conclusion}</div>
                        </div>
                      )}
                      <div className="pat-dossier-section">
                        <h4>Historique</h4>
                        {selectedAnalyse.timeline.length === 0 && <p className="pat-dossier-empty">Aucun evenement.</p>}
                        {selectedAnalyse.timeline.map((event) => (
                          <div key={event.id} style={{ borderLeft: "3px solid #ec4899", marginBottom: 10, padding: "8px 12px", background: "#fff", borderRadius: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{event.eventType}</div>
                            <div style={{ color: "#334155", fontSize: 14 }}>{event.description}</div>
                            <div style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(event.createdAt).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="pat-empty-state">
                  <FaVials size={48} style={{ color: "#cbd5e1" }} />
                  <h3>Aucune analyse</h3>
                  <p>Votre medecin n'a pas encore enregistre d'analyse pour vous.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Profile Tab ─── */}
          {activeTab === "profile" && (
            <div className="pat-profile-card">
              <div className="pat-profile-avatar">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <h2>{user?.prenom} {user?.nom}</h2>
              <p className="pat-profile-email">{user?.email}</p>
              <div className="pat-profile-info">
                <div className="pat-profile-row"><span>Rôle</span><span>Patient</span></div>
                <div className="pat-profile-row"><span>ID</span><span>{user?.id}</span></div>
              </div>
              <button className="pat-btn pat-btn-secondary" onClick={() => navigate("/profile")}>
                Modifier mon profil
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ─── Create Rendez-vous Modal ─── */}
      {showRdvModal && (
        <div className="pat-modal-overlay" onClick={() => setShowRdvModal(false)}>
          <div className="pat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pat-modal-header">
              <h2><FaCalendarAlt /> Nouveau Rendez-vous</h2>
              <button className="pat-modal-close" onClick={() => setShowRdvModal(false)}><FaTimes /></button>
            </div>
            <div className="pat-modal-body">
              <div className="pat-form-group">
                <label>Médecin</label>
                <select
                  value={rdvForm.medecinId || ""}
                  onChange={(e) => {
                    const medecinId = Number(e.target.value);
                    const next = { ...rdvForm, medecinId, disponibiliteId: 0 };
                    setRdvForm(next);
                    if (next.dateRdv) loadAvailableSlots(medecinId, next.dateRdv);
                  }}
                >
                  <option value="">-- Sélectionner un médecin --</option>
                  {medecins.map((m) => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.prenom} {m.nom} {m.specialite ? `(${m.specialite})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pat-form-group">
                <label>Date</label>
                <input type="date" value={rdvForm.dateRdv || ""} onChange={(e) => {
                  const dateRdv = e.target.value;
                  const next = { ...rdvForm, dateRdv, disponibiliteId: 0 };
                  setRdvForm(next);
                  if (next.medecinId) loadAvailableSlots(next.medecinId, dateRdv);
                }} />
              </div>
              <div className="pat-form-group">
                <label>Créneau disponible</label>
                <select value={rdvForm.disponibiliteId || ""} onChange={(e) => {
                  const slotId = Number(e.target.value);
                  const slot = availableSlots.find(s => s.id === slotId);
                  setRdvForm(prev => ({ ...prev, disponibiliteId: slotId, heureRdv: slot ? slot.heureDebut : "" }));
                }}>
                  <option value="">-- Sélectionner un créneau --</option>
                  {availableSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>{slot.heureDebut} - {slot.heureFin}</option>
                  ))}
                </select>
              </div>
              <div className="pat-form-group">
                <label>Motif</label>
                <textarea rows={3} value={rdvForm.motif || ""} onChange={(e) => setRdvForm({ ...rdvForm, motif: e.target.value })} placeholder="Décrivez le motif de votre rendez-vous..." />
              </div>
            </div>
            <div className="pat-modal-footer">
              <button className="pat-btn pat-btn-secondary" onClick={() => setShowRdvModal(false)}>Annuler</button>
              <button className="pat-btn pat-btn-primary" onClick={handleCreateRdv}><FaPlus /> Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
