import React, { useEffect, useMemo, useState } from "react";
import {
  FaUserMd,
  FaUser,
  FaVials,
  FaCog,
  FaCalendarAlt,
  FaBell,
  FaEnvelope,
  FaPhone,
  FaSignOutAlt,
  FaHome,
  FaSyncAlt,
  FaShieldAlt,
  FaDatabase,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  adminGetAllUsers,
  adminActivateUser,
  adminDeactivateUser,
  adminDeletePatient,
  adminGetAllRendezVous,
  adminGetAllDisponibilites,
  adminGetAllDossiers,
  adminGetAllNotifications,
  adminGetAllAnalyses,
  logout,
  isAuthenticated,
  getUser,
} from "../services/api";
import type {
  AdminUtilisateur,
  RendezVousDTO,
  DisponibiliteDTO,
  DossierMedicalDTO,
  NotificationDTO,
  AnalyseResultatDTO,
} from "../services/api";
import "./AdminDashboard.css";

const roles = [
  { label: "Tous les roles", value: "" },
  { label: "Medecins", value: "Medecin" },
  { label: "Patients", value: "Patient" },
  { label: "Administrateurs", value: "Administrateur" },
];

const status = [
  { label: "Tous les statuts", value: "" },
  { label: "Active", value: "active" },
  { label: "Desactive", value: "inactive" },
];

type AdminSection = "dashboard" | "users" | "rendezvous" | "analyses" | "settings";

function normalizeStatusText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isCompteActive(statusCompte?: string) {
  const normalized = normalizeStatusText(statusCompte);
  if (!normalized) return false;

  const inactiveKeywords = ["desactive", "inactive", "disabled", "suspend", "bloque", "blocked"];
  if (inactiveKeywords.some((keyword) => normalized.includes(keyword))) {
    return false;
  }

  const activeKeywords = ["active", "actif"];
  return activeKeywords.some((keyword) => normalized.includes(keyword));
}

function mapUser(u: AdminUtilisateur) {
  const initials = `${(u.prenom?.[0] || "").toUpperCase()}${(u.nom?.[0] || "").toUpperCase()}`;
  const roleColor = u.typeUtilisateur === "Medecin" ? "#4f8cff" : u.typeUtilisateur === "Patient" ? "#a259e6" : "#16a34a";
  const roleBg = u.typeUtilisateur === "Medecin" ? "#e7f2ff" : u.typeUtilisateur === "Patient" ? "#f3e8ff" : "#d1fae5";
  const isActive = isCompteActive(u.statusCompte);

  return {
    id: u.id,
    initials,
    name: `${u.prenom} ${u.nom}`,
    role: u.typeUtilisateur,
    roleColor,
    roleBg,
    job: u.specialite || "",
    email: u.email || "",
    phone: u.telephone || "",
    dateNaissance: u.dateNaissance || "",
    active: isActive,
  };
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<ReturnType<typeof mapUser>[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [loadingToggleId, setLoadingToggleId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");

  const [rendezVous, setRendezVous] = useState<RendezVousDTO[]>([]);
  const [disponibilites, setDisponibilites] = useState<DisponibiliteDTO[]>([]);
  const [dossiers, setDossiers] = useState<DossierMedicalDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [analyses, setAnalyses] = useState<AnalyseResultatDTO[]>([]);

  const navigate = useNavigate();
  const currentUser = getUser();

  const refreshAllData = async () => {
    const [usersData, rdvData, slotData, dossierData, notifData, analysesData] = await Promise.all([
      adminGetAllUsers(),
      adminGetAllRendezVous(),
      adminGetAllDisponibilites(),
      adminGetAllDossiers(),
      adminGetAllNotifications(),
      adminGetAllAnalyses(),
    ]);

    setUsers(usersData.map(mapUser));
    setRendezVous(rdvData);
    setDisponibilites(slotData);
    setDossiers(dossierData);
    setNotifications(notifData);
    setAnalyses(analysesData);
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/admin-login");
      return;
    }

    refreshAllData().catch(() => {
      logout();
      navigate("/admin-login");
    });
  }, [navigate]);

  const handleToggleActive = async (userId: number, isCurrentlyActive: boolean) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setLoadingToggleId(userId);
    try {
      if (isCurrentlyActive) {
        await adminDeactivateUser(user.id);
      } else {
        await adminActivateUser(user.id);
      }

      // Always re-read users from backend so UI reflects the database truth.
      const refreshedUsers = await adminGetAllUsers();
      setUsers(refreshedUsers.map(mapUser));
    } finally {
      setLoadingToggleId(null);
    }
  };

  const handleDeletePatientAsAdmin = async (id: number) => {
    if (!confirm("Supprimer ce patient ?")) return;
    await adminDeletePatient(id);
    setUsers((prev) => prev.filter((u) => !(u.id === id && u.role === "Patient")));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin-login");
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === "" || u.role === roleFilter) &&
          (statusFilter === "" || (statusFilter === "active" && u.active) || (statusFilter === "inactive" && !u.active)) &&
          `${u.name} ${u.email} ${u.job}`.toLowerCase().includes(search.toLowerCase())
      ),
    [users, roleFilter, statusFilter, search]
  );

  const unreadNotifCount = notifications.filter((n) => !n.lu).length;
  const analysesInProgress = analyses.filter((a) => !["RESULTAT_DISPONIBLE", "VALIDE"].includes((a.statut || "").toUpperCase())).length;

  const sectionTitle =
    activeSection === "dashboard"
      ? "Tableau de bord global"
      : activeSection === "users"
      ? "Gestion des utilisateurs"
      : activeSection === "rendezvous"
      ? "Rendez-vous et creneaux"
      : activeSection === "analyses"
      ? "Analyses et dossiers"
      : "Parametres systeme";

  const sectionSubtitle =
    activeSection === "dashboard"
      ? "Vue unifiee de votre plateforme medicale"
      : activeSection === "users"
      ? "Activation, recherche et administration des comptes"
      : activeSection === "rendezvous"
      ? "Suivi des rendez-vous et disponibilites medecin"
      : activeSection === "analyses"
      ? "Module dedie aux analyses/resultats et dossiers medicals"
      : "Actions de maintenance et securite";

  return (
    <div className="admin-dashboard-root">
      <aside className="admin-sidebar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 0 32px 36px" }}>
            <div className="admin-sidebar-logo">
              <FaUserMd size={32} color="#fff" />
            </div>
            <div>
              <div className="admin-sidebar-title">MediCare</div>
              <div className="admin-sidebar-subtitle">Administration</div>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <SidebarButton icon={<FaHome />} label="Tableau de Bord" active={activeSection === "dashboard"} onClick={() => setActiveSection("dashboard")} />
            <SidebarButton icon={<FaUser />} label="Utilisateurs" active={activeSection === "users"} onClick={() => setActiveSection("users")} count={users.length} />
            <SidebarButton icon={<FaCalendarAlt />} label="Rendez-vous" active={activeSection === "rendezvous"} onClick={() => setActiveSection("rendezvous")} count={rendezVous.length} />
            <SidebarButton icon={<FaVials />} label="Analyses" active={activeSection === "analyses"} onClick={() => setActiveSection("analyses")} count={analyses.length} />
            <SidebarButton icon={<FaCog />} label="Parametres" active={activeSection === "settings"} onClick={() => setActiveSection("settings")} />
          </nav>
        </div>

        <div style={{ padding: "0 0 0 36px" }}>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-avatar">
              {currentUser ? `${(currentUser.prenom?.[0] || "").toUpperCase()}${(currentUser.nom?.[0] || "").toUpperCase()}` : "AD"}
            </div>
            <div>
              <div className="admin-sidebar-user-info">{currentUser ? `${currentUser.prenom} ${currentUser.nom}` : "Admin"}</div>
              <div className="admin-sidebar-user-email">{currentUser?.email || ""}</div>
            </div>
          </div>
          <button className="admin-sidebar-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Deconnexion
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <div>
            <div className="admin-header-title">{sectionTitle}</div>
            <div className="admin-header-subtitle">{sectionSubtitle}</div>
          </div>
          <div className="admin-header-actions">
            <button className="admin-action-btn" onClick={refreshAllData}>
              <FaSyncAlt /> Actualiser
            </button>
            <div className="admin-header-notif">
              <FaBell size={18} color="#222" />
              <span className="admin-header-notif-badge">{unreadNotifCount}</span>
              <span className="admin-header-avatar">
                {currentUser ? `${(currentUser.prenom?.[0] || "").toUpperCase()}${(currentUser.nom?.[0] || "").toUpperCase()}` : "AD"}
              </span>
            </div>
          </div>
        </div>

        {activeSection === "dashboard" && (
          <>
            <div className="admin-summary-grid">
              <SummaryCard title="Utilisateurs" value={users.length} subtitle="Comptes total" />
              <SummaryCard title="Rendez-vous" value={rendezVous.length} subtitle="Flux global" />
              <SummaryCard title="Analyses en cours" value={analysesInProgress} subtitle="Suivi clinique" />
              <SummaryCard title="Notifications" value={unreadNotifCount} subtitle="Non lues" />
            </div>
          </>
        )}

        {activeSection === "users" && (
          <>
            <div className="admin-filters">
              <input className="admin-filters-input" type="text" placeholder="Rechercher par nom, email ou specialite..." value={search} onChange={(e) => setSearch(e.target.value)} />

              <div className="admin-filters-dropdown" tabIndex={0} onClick={() => setRoleDropdown((v) => !v)} onBlur={() => setRoleDropdown(false)} style={{ position: "relative" }}>
                {roles.find((r) => r.value === roleFilter)?.label || roles[0].label}
                <span style={{ float: "right", marginLeft: 8 }}>▼</span>
                {roleDropdown && (
                  <div className="admin-filters-dropdown-list">
                    {roles.map((r) => (
                      <div key={r.value} className={`admin-filters-dropdown-item${roleFilter === r.value ? " selected" : ""}`} onMouseDown={() => { setRoleFilter(r.value); setRoleDropdown(false); }}>
                        {r.label} {roleFilter === r.value && <span>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-filters-dropdown" tabIndex={0} onClick={() => setStatusDropdown((v) => !v)} onBlur={() => setStatusDropdown(false)} style={{ position: "relative" }}>
                {status.find((s) => s.value === statusFilter)?.label || status[0].label}
                <span style={{ float: "right", marginLeft: 8 }}>▼</span>
                {statusDropdown && (
                  <div className="admin-filters-dropdown-list">
                    {status.map((s) => (
                      <div key={s.value} className={`admin-filters-dropdown-item${statusFilter === s.value ? " selected" : ""}`} onMouseDown={() => { setStatusFilter(s.value); setStatusDropdown(false); }}>
                        {s.label} {statusFilter === s.value && <span>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>UTILISATEUR</th>
                    <th>CONTACT</th>
                    <th>ROLE</th>
                    <th>DETAILS</th>
                    <th>ACTIVATION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div className="admin-user-avatar" style={{ background: u.roleBg, color: u.roleColor }}>{u.initials}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#222" }}>{u.name}</div>
                          <div style={{ color: "#64748b", fontSize: 14 }}>{u.job}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#222", fontSize: 15 }}>
                          <FaEnvelope style={{ color: "#64748b" }} /> {u.email}
                        </div>
                        {u.role === "Patient" && u.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#222", fontSize: 15, marginTop: 2 }}>
                            <FaPhone style={{ color: "#64748b" }} /> {u.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="admin-role-badge" style={{ background: u.roleBg, color: u.roleColor }}>{u.role}</span>
                      </td>
                      <td>
                        {u.role === "Patient" && u.dateNaissance && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#222", fontSize: 14 }}>
                            <FaCalendarAlt style={{ color: "#64748b", fontSize: 14 }} /> {u.dateNaissance}
                          </div>
                        )}
                        {u.role === "Medecin" && u.job && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#222", fontSize: 14 }}>
                            <FaUserMd style={{ color: "#64748b", fontSize: 14 }} /> {u.job}
                          </div>
                        )}
                        {u.role === "Administrateur" && <span style={{ color: "#94a3b8", fontSize: 14 }}>—</span>}
                      </td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={u.active} onChange={() => handleToggleActive(u.id, u.active)} disabled={loadingToggleId === u.id} />
                          <span className="slider round"></span>
                        </label>
                        <span style={{ marginLeft: 8, color: u.active ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                          {loadingToggleId === u.id ? "..." : u.active ? "Active" : "Desactive"}
                        </span>
                        {u.role === "Patient" && (
                          <button
                            style={{ marginLeft: 10, border: "none", background: "#fee2e2", color: "#991b1b", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
                            onClick={() => handleDeletePatientAsAdmin(u.id)}
                          >
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>Aucun utilisateur</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSection === "rendezvous" && (
          <>
            <div className="admin-table-container">
              <div className="admin-section-title">Rendez-vous globaux</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Medecin</th>
                    <th>Motif</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVous.map((r) => (
                    <tr key={r.id}>
                      <td>{r.dateRdv}</td>
                      <td>{r.heureRdv}</td>
                      <td>{r.patientPrenom} {r.patientNom}</td>
                      <td>{r.medecinPrenom} {r.medecinNom}</td>
                      <td>{r.motif || "—"}</td>
                      <td>{r.statut}</td>
                    </tr>
                  ))}
                  {rendezVous.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>Aucune donnee</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="admin-table-container" style={{ marginTop: 16 }}>
              <div className="admin-section-title">Creneaux des medecins</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Debut</th>
                    <th>Fin</th>
                    <th>Medecin</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {disponibilites.map((s) => (
                    <tr key={s.id}>
                      <td>{s.dateDisponibilite}</td>
                      <td>{s.heureDebut}</td>
                      <td>{s.heureFin}</td>
                      <td>{s.medecinPrenom} {s.medecinNom}</td>
                      <td>{s.statut}</td>
                    </tr>
                  ))}
                  {disponibilites.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>Aucune donnee</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSection === "analyses" && (
          <>
            <div className="admin-table-container">
              <div className="admin-section-title">Analyses & resultats</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Medecin</th>
                    <th>Analyse</th>
                    <th>Priorite</th>
                    <th>Statut</th>
                    <th>Progression</th>
                    <th>Derniere MAJ</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => (
                    <tr key={a.id}>
                      <td>{a.patientPrenom} {a.patientNom}</td>
                      <td>{a.medecinPrenom} {a.medecinNom}</td>
                      <td>{a.typeAnalyse}</td>
                      <td>{a.priorite}</td>
                      <td>{a.statut}</td>
                      <td>{a.progression}%</td>
                      <td>{new Date(a.dateMiseAJour).toLocaleString()}</td>
                    </tr>
                  ))}
                  {analyses.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8" }}>Aucune donnee</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="admin-table-container" style={{ marginTop: 16 }}>
              <div className="admin-section-title">Dossiers medicaux</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Diagnostics</th>
                    <th>Analyses</th>
                    <th>Resultats</th>
                    <th>Images</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d) => (
                    <tr key={d.id}>
                      <td>{d.patientPrenom} {d.patientNom}</td>
                      <td>{d.diagnostics?.length || 0}</td>
                      <td>{d.analyses?.length || 0}</td>
                      <td>{d.resultats?.length || 0}</td>
                      <td>{d.images?.length || d.imageUrls?.length || 0}</td>
                    </tr>
                  ))}
                  {dossiers.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>Aucune donnee</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSection === "settings" && (
          <div className="admin-section-grid">
            <div className="admin-table-container" style={{ padding: 18 }}>
              <div className="admin-section-title">Securite & acces</div>
              <div className="admin-setting-row"><FaShieldAlt /> Controlez les activations de comptes en section Utilisateurs.</div>
              <div className="admin-setting-row"><FaBell /> Les notifications non lues sont visibles en tete du tableau de bord.</div>
              <div className="admin-setting-row"><FaDatabase /> Les images dossier sont maintenant stockees directement en MongoDB.</div>
            </div>
            <div className="admin-table-container" style={{ padding: 18 }}>
              <div className="admin-section-title">Maintenance</div>
              <button className="admin-action-btn approve" onClick={refreshAllData}><FaSyncAlt /> Recharger toutes les donnees</button>
              <button className="admin-action-btn reject" onClick={handleLogout} style={{ marginTop: 10 }}><FaSignOutAlt /> Fermer la session admin</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function SidebarButton({
  icon,
  label,
  active,
  onClick,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button className={`admin-sidebar-btn${active ? " active" : ""}`} onClick={onClick}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {typeof count === "number" && <span className="admin-nav-count">{count}</span>}
    </button>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <div className="admin-summary-card">
      <div className="admin-summary-title">{title}</div>
      <div className="admin-summary-value">{value}</div>
      <div className="admin-summary-subtitle">{subtitle}</div>
    </div>
  );
}

export default AdminDashboard;
