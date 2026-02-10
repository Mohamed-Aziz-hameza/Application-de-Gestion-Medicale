
import React, { useState } from "react";
import { FaUserMd, FaUser, FaVials, FaCog, FaCalendarAlt, FaBell, FaEnvelope, FaPhone, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const initialUsers = [
  {
    initials: "SM",
    name: "Sarah Martin",
    role: "Médecin",
    roleColor: "#4f8cff",
    roleBg: "#e7f2ff",
    job: "Cardiologue",
    email: "dr.sarah.martin@hopital.tn",
    phone: "+216 98 765 432",
    active: false,
    date: "15/01/2024",
  },
  {
    initials: "ML",
    name: "Marie Lefebvre",
    role: "Patient",
    roleColor: "#a259e6",
    roleBg: "#f3e8ff",
    job: "",
    email: "marie.lefebvre@email.com",
    phone: "+216 97 654 321",
    active: false,
    date: "20/01/2024",
  },

  {
    initials: "AB",
    name: "Ahmed Ben Ali",
    role: "Médecin",
    roleColor: "#4f8cff",
    roleBg: "#e7f2ff",
    job: "Pédiatre",
    email: "dr.ahmed.benali@clinic.tn",
    phone: "+216 96 543 210",
    active: false,
    date: "22/01/2024",
  },
];

const roles = [
  { label: "Tous les rôles", value: "" },
  { label: "Médecins", value: "Médecin" },
  { label: "Patients", value: "Patient" },
  { label: "Administrateurs", value: "Administrateur" },
];
const status = [
  { label: "Tous les statuts", value: "" },
  { label: "Activé", value: "active" },
  { label: "Désactivé", value: "inactive" },
];
const AdminDashboard = () => {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const navigate = useNavigate();

  const handleToggleActive = (idx: number) => {
    setUsers((prev) => prev.map((u, i) => i === idx ? { ...u, active: !u.active } : u));
  };
  const handleLogout = () => {
    navigate("/admin-login");
  };

  const filteredUsers = users.filter(u =>
    (roleFilter === "" || u.role === roleFilter || (roleFilter === "Administrateur" && u.initials === "AD")) &&
    (statusFilter === "" || (statusFilter === "active" && u.active) || (statusFilter === "inactive" && !u.active)) &&
    (`${u.name} ${u.email} ${u.job}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-dashboard-root">
      {/* Sidebar */}
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
            <SidebarButton icon={<FaCalendarAlt />} label="Tableau de Bord" active={false} />
            <SidebarButton icon={<FaUser />} label="Utilisateurs" active={true} />
            <SidebarButton icon={<FaCalendarAlt />} label="Rendez-vous" active={false} />
            <SidebarButton icon={<FaVials />} label="Analyses" active={false} />
            <SidebarButton icon={<FaCog />} label="Paramètres" active={false} />
          </nav>
        </div>
        <div style={{ padding: "0 0 0 36px" }}>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-avatar">AD</div>
            <div>
              <div className="admin-sidebar-user-info">Admin Principal</div>
              <div className="admin-sidebar-user-email">admin@medicare.com</div>
            </div>
          </div>
          <button className="admin-sidebar-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <div>
            <div className="admin-header-title">Panneau d'Administration</div>
            <div className="admin-header-subtitle">Bienvenue dans votre espace de gestion</div>
          </div>
          <div className="admin-header-actions">
            <div className="admin-header-notif">
              <FaBell size={18} color="#222" />
              <span className="admin-header-notif-badge">3</span>
              <span className="admin-header-avatar">AD</span>
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="admin-filters">
          <input className="admin-filters-input" type="text" placeholder="Rechercher par nom, prénom ou email..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="admin-filters-dropdown" tabIndex={0} onClick={() => setRoleDropdown(v => !v)} onBlur={() => setRoleDropdown(false)} style={{ position: "relative" }}>
            {roles.find((r: {label: string, value: string}) => r.value === roleFilter)?.label || roles[0].label}
            <span style={{ float: "right", marginLeft: 8 }}>▼</span>
            {roleDropdown && (
              <div className="admin-filters-dropdown-list">
                {roles.map((r: {label: string, value: string}) => (
                  <div key={r.value} className={"admin-filters-dropdown-item" + (roleFilter === r.value ? " selected" : "")} onMouseDown={() => { setRoleFilter(r.value); setRoleDropdown(false); }}>
                    {r.label} {roleFilter === r.value && <span>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="admin-filters-dropdown" tabIndex={0} onClick={() => setStatusDropdown(v => !v)} onBlur={() => setStatusDropdown(false)} style={{ position: "relative" }}>
            {status.find((s: {label: string, value: string}) => s.value === statusFilter)?.label || status[0].label}
            <span style={{ float: "right", marginLeft: 8 }}>▼</span>
            {statusDropdown && (
              <div className="admin-filters-dropdown-list">
                {status.map((s: {label: string, value: string}) => (
                  <div key={s.value} className={"admin-filters-dropdown-item" + (statusFilter === s.value ? " selected" : "")} onMouseDown={() => { setStatusFilter(s.value); setStatusDropdown(false); }}>
                    {s.label} {statusFilter === s.value && <span>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>UTILISATEUR</th>
                <th>CONTACT</th>
                <th>RÔLE</th>
                <th>ACTIVATION</th>
                <th>INSCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr key={idx}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#222", fontSize: 15, marginTop: 2 }}>
                      <FaPhone style={{ color: "#64748b" }} /> {u.phone}
                    </div>
                  </td>
                  <td>
                    <span className="admin-role-badge" style={{ background: u.roleBg, color: u.roleColor }}>{u.role}</span>
                  </td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={u.active} onChange={() => handleToggleActive(idx)} />
                      <span className="slider round"></span>
                    </label>
                    <span style={{ marginLeft: 8, color: u.active ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {u.active ? 'Activé' : 'Désactivé'}
                    </span>
                  </td>
                  <td>{u.date}</td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

function SidebarButton({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <button className={"admin-sidebar-btn" + (active ? " active" : "") }>
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  );
}

export default AdminDashboard;
