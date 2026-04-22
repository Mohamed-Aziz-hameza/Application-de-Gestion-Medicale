import React, { useState, useEffect } from "react";
import {
  FaUserMd, FaUser, FaCalendarAlt, FaFolderOpen, FaSignOutAlt,
  FaBell, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch,
  FaNotesMedical, FaStethoscope, FaFileMedical, FaVials
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  isAuthenticated, getUser, logout,
  getAllPatients, getMedecinConsultations, createConsultation, deleteConsultation,
  getDossierByPatient, createDossierMedical, updateDossierMedical, deleteDossierMedical,
  getMedecinRendezVous, getMedecinPendingRendezVous, updateRendezVousStatut,
  createPatientByMedecin, updatePatientByMedecin, deletePatientByMedecin,
  generateDisponibilites, getMyDisponibilites, markSlotIndisponible, deleteDisponibilite,
  rescheduleRendezVous, getMyNotifications, getMyUnreadNotificationCount,
  markNotificationAsRead, markAllNotificationsAsRead,
  uploadDossierImages, deleteDossierImage,
  createAnalyseResultat, updateAnalyseResultat, addAnalyseTimelineEvent,
  getMedecinAnalyses, createAnalyseResultatWithAi, approveAnalyseAiByDoctor
} from "../services/api";
import type {
  UtilisateurResponseDTO, ConsultationDTO, DossierMedicalDTO, RendezVousDTO,
  CreateConsultationRequest, CreateDossierMedicalRequest, RegisterPatientRequest,
  DisponibiliteDTO, GenerateDisponibilitesRequest, NotificationDTO,
  AnalyseResultatDTO, CreateAnalyseResultatRequest, CreateAnalyseAvecAiRequest, UpdateAnalyseResultatRequest
} from "../services/api";
import "./MedecinDashboard.css";

type Tab = "patients" | "consultations" | "dossiers" | "rendezvous" | "planning" | "analyses";

const MedecinDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [activeTab, setActiveTab] = useState<Tab>("patients");
  const [patients, setPatients] = useState<UtilisateurResponseDTO[]>([]);
  const [consultations, setConsultations] = useState<ConsultationDTO[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVousDTO[]>([]);
  const [pendingRdv, setPendingRdv] = useState<RendezVousDTO[]>([]);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<UtilisateurResponseDTO | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<DossierMedicalDTO | null>(null);
  const [viewDossier, setViewDossier] = useState<DossierMedicalDTO | null>(null);

  // Consultation form
  const [consultForm, setConsultForm] = useState<CreateConsultationRequest>({ patientId: 0, date: "", type: "", notes: "" });

  // Dossier form
  const [dossierForm, setDossierForm] = useState<CreateDossierMedicalRequest>({ patientId: 0, diagnostics: [], prescriptions: [], notesMedecin: "" });
  const [newDiagnostic, setNewDiagnostic] = useState("");
  const [newPrescription, setNewPrescription] = useState("");

  // Patient CRUD
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<UtilisateurResponseDTO | null>(null);
  const [patientForm, setPatientForm] = useState<RegisterPatientRequest>({ nom: "", prenom: "", email: "", motDePasse: "", dateNaissance: "", telephone: "" });

  // Planning / slots / notifications
  const [slots, setSlots] = useState<DisponibiliteDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [planningForm, setPlanningForm] = useState<GenerateDisponibilitesRequest>({
    dateDebut: "",
    dateFin: "",
    heureDebut: "08:00",
    heureFin: "17:00",
    dureeMinutes: 30,
    joursSemaine: [1, 2, 3, 4, 5]
  });
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedRdvForReschedule, setSelectedRdvForReschedule] = useState<RendezVousDTO | null>(null);
  const [newSlotId, setNewSlotId] = useState<number>(0);

  // Dossier advanced fields
  const [antecedentsText, setAntecedentsText] = useState("");
  const [analysesText, setAnalysesText] = useState("");
  const [resultatsText, setResultatsText] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Dedicated analyses/resultats module
  const [analysesModule, setAnalysesModule] = useState<AnalyseResultatDTO[]>([]);
  const [showAnalyseCreateModal, setShowAnalyseCreateModal] = useState(false);
  const [showAnalyseUpdateModal, setShowAnalyseUpdateModal] = useState(false);
  const [selectedAnalyse, setSelectedAnalyse] = useState<AnalyseResultatDTO | null>(null);
  const [analyseCreateForm, setAnalyseCreateForm] = useState<CreateAnalyseResultatRequest>({
    patientId: 0,
    typeAnalyse: "",
    motifClinique: "",
    laboratoire: "",
    priorite: "NORMALE",
  });
  const [analyseAiInstructions, setAnalyseAiInstructions] = useState("");
  const [analyseUpdateForm, setAnalyseUpdateForm] = useState<UpdateAnalyseResultatRequest>({
    statut: "EN_ANALYSE",
    progression: 30,
    resultatValeur: "",
    unite: "",
    intervalleReference: "",
    interpretation: "",
    conclusion: "",
    commentaireTimeline: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/doctor-login"); return; }
    const user = getUser();
    if (!user || user.role !== "ROLE_MEDECIN") { navigate("/doctor-login"); return; }
    loadData();
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotificationsOnly();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [p, c, r, pr, s, n, unread, analyses] = await Promise.all([
        getAllPatients(),
        getMedecinConsultations(),
        getMedecinRendezVous(),
        getMedecinPendingRendezVous(),
        getMyDisponibilites(),
        getMyNotifications(),
        getMyUnreadNotificationCount(),
        getMedecinAnalyses(),
      ]);
      setPatients(p);
      setConsultations(c);
      setRendezVous(r);
      setPendingRdv(pr);
      setSlots(s);
      setNotifications(n);
      setUnreadNotifCount(unread.unread || 0);
      setAnalysesModule(analyses);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const loadNotificationsOnly = async () => {
    try {
      const [n, unread] = await Promise.all([getMyNotifications(), getMyUnreadNotificationCount()]);
      setNotifications(n);
      setUnreadNotifCount(unread.unread || 0);
    } catch {
      // keep current state on transient network errors
    }
  };

  const showNotif = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
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
        // If bulk read fails, we still show notifications to user.
      }
      await loadNotificationsOnly();
    }
  };

  const handleReadNotification = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotificationsOnly();
    } catch (err: any) {
      showNotif("error", err.message || "Impossible de marquer la notification");
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotificationsOnly();
    } catch (err: any) {
      showNotif("error", err.message || "Erreur de mise a jour des notifications");
    }
  };

  const handleLogout = async () => { await logout(); navigate("/doctor-login"); };

  // === Patient CRUD ===
  const openCreatePatientModal = () => {
    setEditingPatient(null);
    setPatientForm({ nom: "", prenom: "", email: "", motDePasse: "", dateNaissance: "", telephone: "" });
    setShowPatientModal(true);
  };

  const openEditPatientModal = (p: UtilisateurResponseDTO) => {
    setEditingPatient(p);
    setPatientForm({
      nom: p.nom || "", prenom: p.prenom || "", email: p.email || "",
      motDePasse: "", dateNaissance: p.dateNaissance || "", telephone: p.telephone || ""
    });
    setShowPatientModal(true);
  };

  const handleSavePatient = async () => {
    try {
      if (editingPatient) {
        await updatePatientByMedecin(editingPatient.id, patientForm);
        showNotif("success", "Patient modifié avec succès");
      } else {
        await createPatientByMedecin(patientForm);
        showNotif("success", "Patient créé avec succès");
      }
      setShowPatientModal(false);
      const p = await getAllPatients();
      setPatients(p);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  const handleDeletePatient = async (id: number) => {
    if (!confirm("Supprimer ce patient ? Cette action est irréversible.")) return;
    try {
      await deletePatientByMedecin(id);
      showNotif("success", "Patient supprimé");
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  // === Consultation ===
  const handleCreateConsultation = async () => {
    try {
      await createConsultation(consultForm);
      showNotif("success", "Consultation créée avec succès");
      setShowConsultationModal(false);
      const c = await getMedecinConsultations();
      setConsultations(c);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur lors de la création");
    }
  };

  const handleDeleteConsultation = async (id: number) => {
    if (!confirm("Supprimer cette consultation ?")) return;
    try {
      await deleteConsultation(id);
      showNotif("success", "Consultation supprimée");
      setConsultations((prev: ConsultationDTO[]) => prev.filter((c: ConsultationDTO) => c.id !== id));
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  // === Dossier Medical ===
  const openDossierModal = (patient: UtilisateurResponseDTO, existingDossier?: DossierMedicalDTO) => {
    setSelectedPatient(patient);
    if (existingDossier) {
      setSelectedDossier(existingDossier);
      setDossierForm({
        patientId: patient.id,
        diagnostics: [...existingDossier.diagnostics],
        prescriptions: [...existingDossier.prescriptions],
        notesMedecin: existingDossier.notesMedecin || "",
        antecedents: [...(existingDossier.antecedents || [])],
        analyses: [...(existingDossier.analyses || [])],
        resultats: [...(existingDossier.resultats || [])]
      });
      setAntecedentsText((existingDossier.antecedents || []).join(", "));
      setAnalysesText((existingDossier.analyses || []).join(", "));
      setResultatsText((existingDossier.resultats || []).join(", "));
    } else {
      setSelectedDossier(null);
      setDossierForm({ patientId: patient.id, diagnostics: [], prescriptions: [], notesMedecin: "", antecedents: [], analyses: [], resultats: [] });
      setAntecedentsText("");
      setAnalysesText("");
      setResultatsText("");
    }
    setImageFiles([]);
    setNewDiagnostic("");
    setNewPrescription("");
    setShowDossierModal(true);
  };

  const handleViewDossier = async (patientId: number) => {
    try {
      const d = await getDossierByPatient(patientId);
      setViewDossier(d);
    } catch {
      showNotif("error", "Aucun dossier médical trouvé pour ce patient");
    }
  };

  const handleSaveDossier = async () => {
    try {
      const payload: CreateDossierMedicalRequest = {
        ...dossierForm,
        antecedents: antecedentsText.split(",").map(v => v.trim()).filter(Boolean),
        analyses: analysesText.split(",").map(v => v.trim()).filter(Boolean),
        resultats: resultatsText.split(",").map(v => v.trim()).filter(Boolean)
      };

      let savedDossier: DossierMedicalDTO;
      if (selectedDossier) {
        savedDossier = await updateDossierMedical(selectedDossier.id, payload);
        showNotif("success", "Dossier médical mis à jour");
      } else {
        savedDossier = await createDossierMedical(payload);
        showNotif("success", "Dossier médical créé avec succès");
      }

      if (imageFiles.length > 0) {
        savedDossier = await uploadDossierImages(savedDossier.id, imageFiles);
        showNotif("success", "Images médicales envoyées dans MongoDB");
      }

      setViewDossier(savedDossier);
      setImageFiles([]);
      setShowDossierModal(false);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  const handleDeleteDossier = async (id: string) => {
    if (!confirm("Supprimer ce dossier médical ?")) return;
    try {
      await deleteDossierMedical(id);
      showNotif("success", "Dossier médical supprimé");
      setViewDossier(null);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  const handleDeleteDossierImage = async (dossierId: string, imageId: string) => {
    if (!confirm("Supprimer cette image medicale ?")) return;
    try {
      const updated = await deleteDossierImage(dossierId, imageId);
      setViewDossier(updated);
      setSelectedDossier(updated);
      showNotif("success", "Image supprimee");
    } catch (err: any) {
      showNotif("error", err.message || "Erreur suppression image");
    }
  };

  const addDiagnostic = () => {
    if (newDiagnostic.trim()) {
      setDossierForm((prev: CreateDossierMedicalRequest) => ({ ...prev, diagnostics: [...(prev.diagnostics || []), newDiagnostic.trim()] }));
      setNewDiagnostic("");
    }
  };
  const removeDiagnostic = (idx: number) => {
    setDossierForm((prev: CreateDossierMedicalRequest) => ({ ...prev, diagnostics: (prev.diagnostics || []).filter((_: string, i: number) => i !== idx) }));
  };
  const addPrescription = () => {
    if (newPrescription.trim()) {
      setDossierForm((prev: CreateDossierMedicalRequest) => ({ ...prev, prescriptions: [...(prev.prescriptions || []), newPrescription.trim()] }));
      setNewPrescription("");
    }
  };
  const removePrescription = (idx: number) => {
    setDossierForm((prev: CreateDossierMedicalRequest) => ({ ...prev, prescriptions: (prev.prescriptions || []).filter((_: string, i: number) => i !== idx) }));
  };

  // === Rendez-vous ===
  const handleRdvAction = async (id: number, statut: string) => {
    try {
      await updateRendezVousStatut(id, statut);
      const message = statut === "CONFIRME" ? "confirmé" : statut === "TERMINE" ? "terminé — consultation créée" : "annulé";
      showNotif("success", `Rendez-vous ${message}`);
      const [r, pr, c, s, n, unread] = await Promise.all([
        getMedecinRendezVous(),
        getMedecinPendingRendezVous(),
        getMedecinConsultations(),
        getMyDisponibilites(),
        getMyNotifications(),
        getMyUnreadNotificationCount()
      ]);
      setRendezVous(r);
      setPendingRdv(pr);
      setConsultations(c);
      setSlots(s);
      setNotifications(n);
      setUnreadNotifCount(unread.unread || 0);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  const handleGenerateSlots = async () => {
    try {
      await generateDisponibilites(planningForm);
      showNotif("success", "Planning genere avec succes");
      const s = await getMyDisponibilites();
      setSlots(s);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur generation planning");
    }
  };

  const handleMarkSlotIndisponible = async (slotId: number) => {
    try {
      await markSlotIndisponible(slotId);
      const s = await getMyDisponibilites();
      setSlots(s);
      showNotif("success", "Slot marque indisponible");
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm("Supprimer ce slot ?")) return;
    try {
      await deleteDisponibilite(slotId);
      const s = await getMyDisponibilites();
      setSlots(s);
      showNotif("success", "Slot supprime");
    } catch (err: any) {
      showNotif("error", err.message || "Erreur");
    }
  };

  const openRescheduleModal = (rdv: RendezVousDTO) => {
    setSelectedRdvForReschedule(rdv);
    setNewSlotId(0);
    setShowRescheduleModal(true);
  };

  const handleReschedule = async () => {
    if (!selectedRdvForReschedule || !newSlotId) {
      showNotif("error", "Selectionnez un nouveau slot");
      return;
    }
    try {
      await rescheduleRendezVous(selectedRdvForReschedule.id, { disponibiliteId: newSlotId });
      showNotif("success", "Rendez-vous replanifie");
      setShowRescheduleModal(false);
      setSelectedRdvForReschedule(null);
      setNewSlotId(0);
      const [r, pr, s, n, unread] = await Promise.all([
        getMedecinRendezVous(),
        getMedecinPendingRendezVous(),
        getMyDisponibilites(),
        getMyNotifications(),
        getMyUnreadNotificationCount()
      ]);
      setRendezVous(r);
      setPendingRdv(pr);
      setSlots(s);
      setNotifications(n);
      setUnreadNotifCount(unread.unread || 0);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur replanification");
    }
  };

  // === Analyses / Resultats ===
  const openCreateAnalyseModal = () => {
    setAnalyseCreateForm({
      patientId: 0,
      typeAnalyse: "",
      motifClinique: "",
      laboratoire: "",
      priorite: "NORMALE",
    });
    setAnalyseAiInstructions("");
    setShowAnalyseCreateModal(true);
  };

  const openUpdateAnalyseModal = (analyse: AnalyseResultatDTO) => {
    setSelectedAnalyse(analyse);
    setAnalyseUpdateForm({
      statut: analyse.statut || "EN_ANALYSE",
      progression: analyse.progression ?? 50,
      resultatValeur: analyse.resultatValeur || "",
      unite: analyse.unite || "",
      intervalleReference: analyse.intervalleReference || "",
      interpretation: analyse.interpretation || "",
      conclusion: analyse.conclusion || "",
      commentaireTimeline: "",
    });
    setShowAnalyseUpdateModal(true);
  };

  const handleCreateAnalyse = async () => {
    if (!analyseCreateForm.patientId || !analyseCreateForm.typeAnalyse.trim()) {
      showNotif("error", "Patient et type d'analyse obligatoires");
      return;
    }

    try {
      await createAnalyseResultat(analyseCreateForm);
      showNotif("success", "Analyse creee avec timeline de suivi");
      setShowAnalyseCreateModal(false);
      const [allAnalyses, n, unread] = await Promise.all([
        getMedecinAnalyses(),
        getMyNotifications(),
        getMyUnreadNotificationCount(),
      ]);
      setAnalysesModule(allAnalyses);
      setNotifications(n);
      setUnreadNotifCount(unread.unread || 0);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur creation analyse");
    }
  };

  const handleCreateAnalyseWithAi = async () => {
    if (!analyseCreateForm.patientId || !analyseCreateForm.typeAnalyse.trim()) {
      showNotif("error", "Patient et type d'analyse obligatoires");
      return;
    }

    try {
      const payload: CreateAnalyseAvecAiRequest = {
        ...analyseCreateForm,
        instructions: analyseAiInstructions || undefined,
      };

      await createAnalyseResultatWithAi(payload);
      showNotif("success", "Analyse creee avec IA. Approbation medecin requise.");
      setShowAnalyseCreateModal(false);

      const [allAnalyses, n, unread] = await Promise.all([
        getMedecinAnalyses(),
        getMyNotifications(),
        getMyUnreadNotificationCount(),
      ]);
      setAnalysesModule(allAnalyses);
      setNotifications(n);
      setUnreadNotifCount(unread.unread || 0);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur creation analyse IA");
    }
  };

  const handleApproveAnalyseAi = async (analyseId: number) => {
    try {
      await approveAnalyseAiByDoctor(analyseId);
      showNotif("success", "Analyse IA approuvee par un medecin");
      const allAnalyses = await getMedecinAnalyses();
      setAnalysesModule(allAnalyses);
      if (selectedAnalyse && selectedAnalyse.id === analyseId) {
        setSelectedAnalyse(allAnalyses.find((a) => a.id === analyseId) || null);
      }
    } catch (err: any) {
      showNotif("error", err.message || "Erreur lors de l'approbation");
    }
  };

  const handleUpdateAnalyse = async () => {
    if (!selectedAnalyse) {
      return;
    }

    try {
      await updateAnalyseResultat(selectedAnalyse.id, analyseUpdateForm);
      if (analyseUpdateForm.commentaireTimeline?.trim()) {
        await addAnalyseTimelineEvent(selectedAnalyse.id, {
          eventType: "NOTE_MEDECIN",
          description: analyseUpdateForm.commentaireTimeline,
        });
      }

      showNotif("success", "Analyse mise a jour");
      setShowAnalyseUpdateModal(false);
      const allAnalyses = await getMedecinAnalyses();
      setAnalysesModule(allAnalyses);
      const refreshed = allAnalyses.find((a) => a.id === selectedAnalyse.id) || null;
      setSelectedAnalyse(refreshed);
    } catch (err: any) {
      showNotif("error", err.message || "Erreur mise a jour analyse");
    }
  };

  const availableSlots = slots.filter(s => s.statut === "DISPONIBLE");

  const filteredPatients = patients.filter((p: UtilisateurResponseDTO) =>
    `${p.prenom} ${p.nom} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const initials = currentUser ? `${(currentUser.prenom?.[0] || "").toUpperCase()}${(currentUser.nom?.[0] || "").toUpperCase()}` : "MD";

  return (
    <div className="med-dash-root">
      {/* Notification */}
      {notification && (
        <div className={`med-notification ${notification.type}`}>
          {notification.type === "success" ? <FaCheck /> : <FaTimes />} {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="med-sidebar">
        <div>
          <div className="med-sidebar-brand">
            <div className="med-sidebar-logo"><FaUserMd size={28} color="#fff" /></div>
            <div>
              <div className="med-sidebar-title">MediCare</div>
              <div className="med-sidebar-subtitle">Espace Médecin</div>
            </div>
          </div>
          <nav className="med-sidebar-nav">
            <button className={`med-sidebar-btn ${activeTab === "patients" ? "active" : ""}`} onClick={() => setActiveTab("patients")}>
              <FaUser /> Mes Patients
            </button>
            <button className={`med-sidebar-btn ${activeTab === "consultations" ? "active" : ""}`} onClick={() => setActiveTab("consultations")}>
              <FaStethoscope /> Consultations
            </button>
            <button className={`med-sidebar-btn ${activeTab === "dossiers" ? "active" : ""}`} onClick={() => setActiveTab("dossiers")}>
              <FaFileMedical /> Dossiers Médicaux
            </button>
            <button className={`med-sidebar-btn ${activeTab === "rendezvous" ? "active" : ""}`} onClick={() => setActiveTab("rendezvous")}>
              <FaCalendarAlt /> Rendez-vous
              {pendingRdv.length > 0 && <span className="med-badge">{pendingRdv.length}</span>}
            </button>
            <button className={`med-sidebar-btn ${activeTab === "planning" ? "active" : ""}`} onClick={() => setActiveTab("planning")}>
              <FaCalendarAlt /> Planning
            </button>
            <button className={`med-sidebar-btn ${activeTab === "analyses" ? "active" : ""}`} onClick={() => setActiveTab("analyses")}>
              <FaVials /> Analyses & Resultats
            </button>
            <button className="med-sidebar-btn" onClick={() => navigate("/profile")}>
              <FaUser /> Mon Profil
            </button>
          </nav>
        </div>
        <div className="med-sidebar-bottom">
          <div className="med-sidebar-user">
            <div className="med-sidebar-avatar">{initials}</div>
            <div>
              <div className="med-sidebar-user-name">{currentUser ? `${currentUser.prenom} ${currentUser.nom}` : "Médecin"}</div>
              <div className="med-sidebar-user-email">{currentUser?.email || ""}</div>
            </div>
          </div>
          <button className="med-sidebar-logout" onClick={handleLogout}><FaSignOutAlt /> Déconnexion</button>
        </div>
      </aside>

      {/* Main */}
      <main className="med-main">
        {/* Header */}
        <div className="med-header">
          <div>
            <h1 className="med-header-title">
              {activeTab === "patients" && "Gestion des Patients"}
              {activeTab === "consultations" && "Mes Consultations"}
              {activeTab === "dossiers" && "Dossiers Médicaux"}
              {activeTab === "rendezvous" && "Rendez-vous"}
              {activeTab === "planning" && "Planning Médecin"}
              {activeTab === "analyses" && "Analyses & Resultats"}
            </h1>
            <p className="med-header-subtitle">
              {activeTab === "patients" && "Gérez vos patients et créez des dossiers médicaux"}
              {activeTab === "consultations" && "Historique de toutes vos consultations"}
              {activeTab === "dossiers" && "Consultez et gérez les dossiers médicaux"}
              {activeTab === "rendezvous" && "Gérez vos rendez-vous avec les patients"}
              {activeTab === "planning" && "Définissez vos jours de travail et vos créneaux horaires"}
              {activeTab === "analyses" && "Module dedie pour demandes d'analyse, resultats et timeline de suivi"}
            </p>
          </div>
          <div className="med-header-right">
            <div className="med-notif-icon" onClick={handleOpenNotificationCenter}>
              <FaBell size={18} />
              {unreadNotifCount > 0 && <span className="med-notif-badge">{unreadNotifCount}</span>}
            </div>
            <div className="med-header-avatar">{initials}</div>
            {showNotificationCenter && (
              <div className="med-notif-panel">
                <div className="med-notif-panel-head">
                  <strong>Notifications</strong>
                  <button className="med-btn med-btn-secondary" onClick={handleReadAllNotifications}>Tout lire</button>
                </div>
                <div className="med-notif-panel-list">
                  {notifications.length === 0 && <p className="med-dossier-empty">Aucune notification.</p>}
                  {notifications.slice(0, 12).map((n) => (
                    <button
                      key={n.id}
                      className={`med-notif-item ${n.lu ? "read" : "unread"}`}
                      onClick={() => handleReadNotification(n.id)}
                    >
                      <div className="med-notif-item-title">{n.titre}</div>
                      <div className="med-notif-item-msg">{n.message}</div>
                      <div className="med-notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab: Patients */}
        {activeTab === "patients" && (
          <div className="med-content">
            <div className="med-search-bar" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <FaSearch className="med-search-icon" />
                <input type="text" placeholder="Rechercher un patient..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="med-btn med-btn-primary" onClick={openCreatePatientModal} style={{ whiteSpace: "nowrap" }}>
                <FaPlus /> Ajouter Patient
              </button>
            </div>
            <div className="med-cards-grid">
              {filteredPatients.map(p => (
                <div key={p.id} className="med-patient-card">
                  <div className="med-patient-card-header">
                    <div className="med-patient-avatar">{(p.prenom?.[0] || "").toUpperCase()}{(p.nom?.[0] || "").toUpperCase()}</div>
                    <div>
                      <div className="med-patient-name">{p.prenom} {p.nom}</div>
                      <div className="med-patient-email">{p.email}</div>
                    </div>
                  </div>
                  <div className="med-patient-info">
                    {p.telephone && <span>Tél: {p.telephone}</span>}
                    {p.dateNaissance && <span>Né(e): {p.dateNaissance}</span>}
                  </div>
                  <div className="med-patient-actions">
                    <button className="med-btn med-btn-warning" onClick={() => openEditPatientModal(p)} title="Modifier patient">
                      <FaEdit /> Modifier
                    </button>
                    <button className="med-btn med-btn-danger" onClick={() => handleDeletePatient(p.id)} title="Supprimer patient">
                      <FaTrash /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {filteredPatients.length === 0 && <div className="med-empty">Aucun patient trouvé</div>}
            </div>
          </div>
        )}

        {/* Tab: Consultations */}
        {activeTab === "consultations" && (
          <div className="med-content">
            <div className="med-table-container">
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Notes</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map(c => (
                    <tr key={c.id}>
                      <td>{c.date}</td>
                      <td>{c.patientPrenom} {c.patientNom}</td>
                      <td><span className="med-type-badge">{c.type}</span></td>
                      <td className="med-notes-cell">{c.notes || "—"}</td>
                      <td><span className={`med-status-badge ${(c.statut || "").toLowerCase()}`}>{c.statut}</span></td>
                      <td>
                        <button className="med-btn-icon danger" onClick={() => handleDeleteConsultation(c.id)} title="Supprimer">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {consultations.length === 0 && (
                    <tr><td colSpan={6} className="med-empty-row">Aucune consultation trouvée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Dossiers */}
        {activeTab === "dossiers" && (
          <div className="med-content">
            <p style={{ color: "#64748b", marginBottom: 16 }}>Sélectionnez un patient dans l'onglet "Mes Patients" pour créer ou consulter un dossier médical.</p>
            <div className="med-search-bar">
              <FaSearch className="med-search-icon" />
              <input type="text" placeholder="Rechercher un patient pour voir son dossier..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="med-cards-grid">
              {filteredPatients.map(p => (
                <div key={p.id} className="med-patient-card">
                  <div className="med-patient-card-header">
                    <div className="med-patient-avatar">{(p.prenom?.[0] || "").toUpperCase()}{(p.nom?.[0] || "").toUpperCase()}</div>
                    <div>
                      <div className="med-patient-name">{p.prenom} {p.nom}</div>
                      <div className="med-patient-email">{p.email}</div>
                    </div>
                  </div>
                  <div className="med-patient-actions">
                    <button className="med-btn med-btn-info" onClick={() => handleViewDossier(p.id)}>
                      <FaFolderOpen /> Consulter Dossier
                    </button>
                    <button className="med-btn med-btn-secondary" onClick={() => openDossierModal(p)}>
                      <FaPlus /> Nouveau Dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Rendez-vous */}
        {activeTab === "rendezvous" && (
          <div className="med-content">
            {pendingRdv.length > 0 && (
              <div className="med-pending-section">
                <h3><FaBell /> Demandes en attente ({pendingRdv.length})</h3>
                <div className="med-rdv-cards">
                  {pendingRdv.map(r => (
                    <div key={r.id} className="med-rdv-card pending">
                      <div className="med-rdv-info">
                        <strong>{r.patientPrenom} {r.patientNom}</strong>
                        <span>{r.dateRdv} à {r.heureRdv}</span>
                        <span className="med-rdv-motif">{r.motif}</span>
                      </div>
                      <div className="med-rdv-actions">
                        <button className="med-btn med-btn-success" onClick={() => handleRdvAction(r.id, "CONFIRME")}>
                          <FaCheck /> Confirmer
                        </button>
                        <button className="med-btn med-btn-danger" onClick={() => handleRdvAction(r.id, "ANNULE")}>
                          <FaTimes /> Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h3 style={{ marginTop: 24 }}>Tous les rendez-vous</h3>
            <div className="med-table-container">
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVous.map(r => (
                    <tr key={r.id}>
                      <td>{r.dateRdv}</td>
                      <td>{r.heureRdv}</td>
                      <td>{r.patientPrenom} {r.patientNom}</td>
                      <td>{r.motif || "—"}</td>
                      <td><span className={`med-status-badge ${(r.statut || "").toLowerCase()}`}>{r.statut?.replace("_", " ")}</span></td>
                      <td>
                        {r.statut === "EN_ATTENTE" && (
                          <>
                            <button className="med-btn-icon success" onClick={() => handleRdvAction(r.id, "CONFIRME")} title="Confirmer"><FaCheck /></button>
                            <button className="med-btn-icon danger" onClick={() => handleRdvAction(r.id, "ANNULE")} title="Refuser"><FaTimes /></button>
                            <button className="med-btn-icon" onClick={() => openRescheduleModal(r)} title="Replanifier"><FaEdit /></button>
                          </>
                        )}
                        {r.statut === "CONFIRME" && (
                          <>
                            <button className="med-btn-icon success" onClick={() => handleRdvAction(r.id, "TERMINE")} title="Terminer"><FaCheck /></button>
                            <button className="med-btn-icon" onClick={() => openRescheduleModal(r)} title="Replanifier"><FaEdit /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rendezVous.length === 0 && (
                    <tr><td colSpan={6} className="med-empty-row">Aucun rendez-vous</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "planning" && (
          <div className="med-content">
            <div className="med-card" style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 18 }}>
              <h3 style={{ marginBottom: 12 }}>Générer un planning</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="med-form-group">
                  <label>Date début</label>
                  <input type="date" value={planningForm.dateDebut} onChange={e => setPlanningForm(prev => ({ ...prev, dateDebut: e.target.value }))} />
                </div>
                <div className="med-form-group">
                  <label>Date fin</label>
                  <input type="date" value={planningForm.dateFin} onChange={e => setPlanningForm(prev => ({ ...prev, dateFin: e.target.value }))} />
                </div>
                <div className="med-form-group">
                  <label>Heure début</label>
                  <input type="time" value={planningForm.heureDebut} onChange={e => setPlanningForm(prev => ({ ...prev, heureDebut: e.target.value }))} />
                </div>
                <div className="med-form-group">
                  <label>Heure fin</label>
                  <input type="time" value={planningForm.heureFin} onChange={e => setPlanningForm(prev => ({ ...prev, heureFin: e.target.value }))} />
                </div>
                <div className="med-form-group">
                  <label>Durée slot (min)</label>
                  <input type="number" min={5} value={planningForm.dureeMinutes} onChange={e => setPlanningForm(prev => ({ ...prev, dureeMinutes: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[{ code: 1, label: "Lun" }, { code: 2, label: "Mar" }, { code: 3, label: "Mer" }, { code: 4, label: "Jeu" }, { code: 5, label: "Ven" }, { code: 6, label: "Sam" }].map(day => {
                  const selected = planningForm.joursSemaine?.includes(day.code);
                  return (
                    <button
                      key={day.code}
                      className={`med-btn ${selected ? "med-btn-primary" : "med-btn-secondary"}`}
                      onClick={() => {
                        setPlanningForm(prev => {
                          const current = prev.joursSemaine || [];
                          const next = current.includes(day.code)
                            ? current.filter(d => d !== day.code)
                            : [...current, day.code];
                          return { ...prev, joursSemaine: next };
                        });
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="med-btn med-btn-primary" onClick={handleGenerateSlots}><FaPlus /> Générer</button>
              </div>
            </div>

            <div className="med-table-container" style={{ marginBottom: 18 }}>
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s.id}>
                      <td>{s.dateDisponibilite}</td>
                      <td>{s.heureDebut}</td>
                      <td>{s.heureFin}</td>
                      <td><span className={`med-status-badge ${(s.statut || "").toLowerCase()}`}>{s.statut}</span></td>
                      <td>
                        {s.statut === "DISPONIBLE" && (
                          <>
                            <button className="med-btn-icon danger" onClick={() => handleMarkSlotIndisponible(s.id)} title="Marquer indisponible"><FaTimes /></button>
                            <button className="med-btn-icon danger" onClick={() => handleDeleteSlot(s.id)} title="Supprimer"><FaTrash /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {slots.length === 0 && (
                    <tr><td colSpan={5} className="med-empty-row">Aucun slot défini</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="med-card" style={{ background: "#fff", borderRadius: 16, padding: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Notifications ({unreadNotifCount} non lues)</h3>
              {notifications.length === 0 && <p style={{ color: "#64748b" }}>Aucune notification.</p>}
              {notifications.slice(0, 8).map(n => (
                <div key={n.id} style={{ borderBottom: "1px solid #e2e8f0", padding: "10px 0" }}>
                  <div style={{ fontWeight: 700 }}>{n.titre}</div>
                  <div style={{ color: "#475569" }}>{n.message}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "analyses" && (
          <div className="med-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Demandes et resultats d'analyses</h3>
              <button className="med-btn med-btn-primary" onClick={openCreateAnalyseModal}><FaPlus /> Nouvelle analyse</button>
            </div>

            <div className="med-table-container" style={{ marginBottom: 18 }}>
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Analyse</th>
                    <th>Motif</th>
                    <th>Priorite</th>
                    <th>Origine</th>
                    <th>Statut</th>
                    <th>Progression</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {analysesModule.map((a) => (
                    <tr key={a.id}>
                      <td>{a.patientPrenom} {a.patientNom}</td>
                      <td>{a.typeAnalyse}</td>
                      <td>{a.motifClinique || "—"}</td>
                      <td>{a.priorite}</td>
                      <td>{a.creationTypeLabel || "Creee par un medecin"}</td>
                      <td><span className={`med-status-badge ${(a.statut || "").toLowerCase()}`}>{a.statut}</span></td>
                      <td>{a.progression}%</td>
                      <td>
                        <button className="med-btn-icon" title="Voir details" onClick={() => setSelectedAnalyse(a)}><FaSearch /></button>
                        <button className="med-btn-icon" title="Mettre a jour" onClick={() => openUpdateAnalyseModal(a)}><FaEdit /></button>
                        {a.createdWithAi && !a.approvedByDoctor && (
                          <button className="med-btn-icon success" title="Approuver IA" onClick={() => handleApproveAnalyseAi(a.id)}><FaCheck /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {analysesModule.length === 0 && (
                    <tr><td colSpan={8} className="med-empty-row">Aucune analyse enregistree</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedAnalyse && (
              <div className="med-card" style={{ background: "#fff", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>Details & Timeline: {selectedAnalyse.typeAnalyse}</h3>
                  <button className="med-btn med-btn-secondary" onClick={() => setSelectedAnalyse(null)}>Fermer</button>
                </div>
                <p style={{ color: "#475569", marginTop: 0, marginBottom: 12 }}>
                  Type de creation: <strong>{selectedAnalyse.creationTypeLabel || "Creee par un medecin"}</strong>
                </p>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Resultat</div>
                  <div style={{ color: "#334155", background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                    {selectedAnalyse.resultatValeur ? `${selectedAnalyse.resultatValeur}${selectedAnalyse.unite ? ` ${selectedAnalyse.unite}` : ""}` : "Non renseigne"}
                    {selectedAnalyse.intervalleReference ? ` (Ref: ${selectedAnalyse.intervalleReference})` : ""}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Interpretation</div>
                  <div style={{ color: "#334155", background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                    {selectedAnalyse.interpretation || "Non renseignee"}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Conclusion</div>
                  <div style={{ color: "#334155", background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                    {selectedAnalyse.conclusion || "Non renseignee"}
                  </div>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Historique</div>
                {selectedAnalyse.timeline.length === 0 && <p className="med-dossier-empty">Aucun evenement timeline.</p>}
                {selectedAnalyse.timeline.map((event) => (
                  <div key={event.id} style={{ borderLeft: "3px solid #22c55e", padding: "8px 12px", marginBottom: 8, background: "#f8fafc", borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{event.eventType}</div>
                    <div style={{ color: "#334155", fontSize: 14 }}>{event.description}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(event.createdAt).toLocaleString()} {event.createdBy ? `- ${event.createdBy}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* View Dossier Modal */}
      {viewDossier && (
        <div className="med-modal-overlay" onClick={() => setViewDossier(null)}>
          <div className="med-modal" onClick={e => e.stopPropagation()}>
            <div className="med-modal-header">
              <h2><FaFileMedical /> Dossier Médical</h2>
              <button className="med-modal-close" onClick={() => setViewDossier(null)}><FaTimes /></button>
            </div>
            <div className="med-modal-body">
              <div className="med-dossier-info">
                <strong>Patient:</strong> {viewDossier.patientPrenom} {viewDossier.patientNom}
              </div>
              <div className="med-dossier-section">
                <h4><FaNotesMedical /> Diagnostics</h4>
                {viewDossier.diagnostics?.length > 0 ? (
                  <ul className="med-dossier-list">{viewDossier.diagnostics.map((d, i) => <li key={i}>{d}</li>)}</ul>
                ) : <p className="med-dossier-empty">Aucun diagnostic</p>}
              </div>
              <div className="med-dossier-section">
                <h4><FaFileMedical /> Prescriptions</h4>
                {viewDossier.prescriptions?.length > 0 ? (
                  <ul className="med-dossier-list">{viewDossier.prescriptions.map((p, i) => <li key={i}>{p}</li>)}</ul>
                ) : <p className="med-dossier-empty">Aucune prescription</p>}
              </div>
              <div className="med-dossier-section">
                <h4>Notes du médecin</h4>
                <p>{viewDossier.notesMedecin || "Aucune note"}</p>
              </div>
              <div className="med-dossier-section">
                <h4>Antécédents</h4>
                {viewDossier.antecedents?.length ? <ul className="med-dossier-list">{viewDossier.antecedents.map((a, i) => <li key={i}>{a}</li>)}</ul> : <p className="med-dossier-empty">Aucun antécédent</p>}
              </div>
              <div className="med-dossier-section">
                <h4>Analyses</h4>
                {viewDossier.analyses?.length ? <ul className="med-dossier-list">{viewDossier.analyses.map((a, i) => <li key={i}>{a}</li>)}</ul> : <p className="med-dossier-empty">Aucune analyse</p>}
              </div>
              <div className="med-dossier-section">
                <h4>Résultats</h4>
                {viewDossier.resultats?.length ? <ul className="med-dossier-list">{viewDossier.resultats.map((r, i) => <li key={i}>{r}</li>)}</ul> : <p className="med-dossier-empty">Aucun résultat</p>}
              </div>
              <div className="med-dossier-section">
                <h4>Images</h4>
                {viewDossier.images?.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                    {viewDossier.images.map((img) => (
                      <div key={img.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8 }}>
                        <img src={img.dataUrl} alt={img.fileName || "image medicale"} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{img.fileName || "image"}</div>
                        <button
                          className="med-btn med-btn-danger"
                          style={{ marginTop: 6, width: "100%", justifyContent: "center" }}
                          onClick={() => handleDeleteDossierImage(viewDossier.id, img.id)}
                        >
                          <FaTrash /> Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                ) : <p className="med-dossier-empty">Aucune image</p>}
              </div>
            </div>
            <div className="med-modal-footer">
              <button className="med-btn med-btn-primary" onClick={() => {
                const patient = patients.find(p => p.id === viewDossier.patientId);
                if (patient) { openDossierModal(patient, viewDossier); setViewDossier(null); }
              }}><FaEdit /> Modifier</button>
              <button className="med-btn med-btn-danger" onClick={() => { handleDeleteDossier(viewDossier.id); }}><FaTrash /> Supprimer</button>
              <button className="med-btn med-btn-secondary" onClick={() => setViewDossier(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      {showConsultationModal && (
        <div className="med-modal-overlay" onClick={() => setShowConsultationModal(false)}>
          <div className="med-modal" onClick={e => e.stopPropagation()}>
            <div className="med-modal-header">
              <h2><FaStethoscope /> Nouvelle Consultation</h2>
              <button className="med-modal-close" onClick={() => setShowConsultationModal(false)}><FaTimes /></button>
            </div>
            <div className="med-modal-body">
              <p className="med-modal-patient">Patient: <strong>{selectedPatient?.prenom} {selectedPatient?.nom}</strong></p>
              <div className="med-form-group">
                <label>Date</label>
                <input type="date" value={consultForm.date || ""} onChange={e => setConsultForm(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div className="med-form-group">
                <label>Type</label>
                <select value={consultForm.type || ""} onChange={e => setConsultForm(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="Consultation générale">Consultation générale</option>
                  <option value="Suivi">Suivi</option>
                  <option value="Urgence">Urgence</option>
                  <option value="Contrôle">Contrôle</option>
                  <option value="Spécialiste">Spécialiste</option>
                </select>
              </div>
              <div className="med-form-group">
                <label>Notes</label>
                <textarea rows={4} value={consultForm.notes || ""} onChange={e => setConsultForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes de la consultation..." />
              </div>
            </div>
            <div className="med-modal-footer">
              <button className="med-btn med-btn-primary" onClick={handleCreateConsultation}><FaCheck /> Créer</button>
              <button className="med-btn med-btn-secondary" onClick={() => setShowConsultationModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Dossier Medical Modal */}
      {showDossierModal && (
        <div className="med-modal-overlay" onClick={() => setShowDossierModal(false)}>
          <div className="med-modal large" onClick={e => e.stopPropagation()}>
            <div className="med-modal-header">
              <h2><FaFileMedical /> {selectedDossier ? "Modifier" : "Créer"} Dossier Médical</h2>
              <button className="med-modal-close" onClick={() => setShowDossierModal(false)}><FaTimes /></button>
            </div>
            <div className="med-modal-body">
              <p className="med-modal-patient">Patient: <strong>{selectedPatient?.prenom} {selectedPatient?.nom}</strong></p>

              <div className="med-form-group">
                <label>Diagnostics</label>
                <div className="med-list-input">
                  <input type="text" value={newDiagnostic} onChange={e => setNewDiagnostic(e.target.value)}
                    placeholder="Ajouter un diagnostic..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addDiagnostic())} />
                  <button className="med-btn med-btn-primary" onClick={addDiagnostic}><FaPlus /></button>
                </div>
                <ul className="med-tag-list">
                  {(dossierForm.diagnostics || []).map((d, i) => (
                    <li key={i} className="med-tag">{d} <button onClick={() => removeDiagnostic(i)}><FaTimes /></button></li>
                  ))}
                </ul>
              </div>

              <div className="med-form-group">
                <label>Prescriptions</label>
                <div className="med-list-input">
                  <input type="text" value={newPrescription} onChange={e => setNewPrescription(e.target.value)}
                    placeholder="Ajouter une prescription..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addPrescription())} />
                  <button className="med-btn med-btn-primary" onClick={addPrescription}><FaPlus /></button>
                </div>
                <ul className="med-tag-list">
                  {(dossierForm.prescriptions || []).map((p, i) => (
                    <li key={i} className="med-tag prescription">{p} <button onClick={() => removePrescription(i)}><FaTimes /></button></li>
                  ))}
                </ul>
              </div>

              <div className="med-form-group">
                <label>Notes du médecin</label>
                <textarea rows={4} value={dossierForm.notesMedecin || ""} onChange={e => setDossierForm(prev => ({ ...prev, notesMedecin: e.target.value }))} placeholder="Notes..." />
              </div>

              <div className="med-form-group">
                <label>Antécédents (séparés par des virgules)</label>
                <textarea rows={2} value={antecedentsText} onChange={e => setAntecedentsText(e.target.value)} placeholder="Diabète, Asthme, Hypertension..." />
              </div>

              <div className="med-form-group">
                <label>Analyses (séparées par des virgules)</label>
                <textarea rows={2} value={analysesText} onChange={e => setAnalysesText(e.target.value)} placeholder="NFS, Bilan lipidique..." />
              </div>

              <div className="med-form-group">
                <label>Résultats (séparés par des virgules)</label>
                <textarea rows={2} value={resultatsText} onChange={e => setResultatsText(e.target.value)} placeholder="HbA1c 6.8%, Cholestérol normal..." />
              </div>

              <div className="med-form-group">
                <label>Images medicales (upload depuis le PC)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                />
                {selectedDossier?.images?.length ? (
                  <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
                    Ce dossier contient deja {selectedDossier.images.length} image(s).
                  </p>
                ) : null}
                {imageFiles.length > 0 && (
                  <p style={{ color: "#166534", fontSize: 13, marginTop: 8 }}>
                    {imageFiles.length} fichier(s) pret(s) pour envoi.
                  </p>
                )}
              </div>
            </div>
            <div className="med-modal-footer">
              <button className="med-btn med-btn-primary" onClick={handleSaveDossier}><FaCheck /> {selectedDossier ? "Mettre à jour" : "Créer"}</button>
              <button className="med-btn med-btn-secondary" onClick={() => setShowDossierModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showAnalyseCreateModal && (
        <div className="med-modal-overlay" onClick={() => setShowAnalyseCreateModal(false)}>
          <div className="med-modal" onClick={(e) => e.stopPropagation()}>
            <div className="med-modal-header">
              <h2><FaVials /> Nouvelle analyse</h2>
              <button className="med-modal-close" onClick={() => setShowAnalyseCreateModal(false)}><FaTimes /></button>
            </div>
            <div className="med-modal-body">
              <div className="med-form-group">
                <label>Patient</label>
                <select value={analyseCreateForm.patientId || ""} onChange={(e) => setAnalyseCreateForm((prev) => ({ ...prev, patientId: Number(e.target.value) }))}>
                  <option value="">-- Selectionner un patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                  ))}
                </select>
              </div>
              <div className="med-form-group">
                <label>Type d'analyse</label>
                <input type="text" value={analyseCreateForm.typeAnalyse || ""} onChange={(e) => setAnalyseCreateForm((prev) => ({ ...prev, typeAnalyse: e.target.value }))} placeholder="NFS, Glycemie, Bilan lipidique..." />
              </div>
              <div className="med-form-group">
                <label>Motif clinique</label>
                <textarea rows={3} value={analyseCreateForm.motifClinique || ""} onChange={(e) => setAnalyseCreateForm((prev) => ({ ...prev, motifClinique: e.target.value }))} placeholder="Pourquoi cette analyse est demandee" />
              </div>
              <div className="med-form-group">
                <label>Laboratoire</label>
                <input type="text" value={analyseCreateForm.laboratoire || ""} onChange={(e) => setAnalyseCreateForm((prev) => ({ ...prev, laboratoire: e.target.value }))} placeholder="Nom du laboratoire" />
              </div>
              <div className="med-form-group">
                <label>Priorite</label>
                <select value={analyseCreateForm.priorite || "NORMALE"} onChange={(e) => setAnalyseCreateForm((prev) => ({ ...prev, priorite: e.target.value }))}>
                  <option value="NORMALE">Normale</option>
                  <option value="URGENTE">Urgente</option>
                  <option value="A_SURVEILLER">A surveiller</option>
                </select>
              </div>
              <div className="med-form-group">
                <label>Instructions IA (optionnel)</label>
                <textarea rows={2} value={analyseAiInstructions} onChange={(e) => setAnalyseAiInstructions(e.target.value)} placeholder="Contexte complementaire pour la generation IA" />
              </div>
            </div>
            <div className="med-modal-footer">
              <button className="med-btn med-btn-primary" onClick={handleCreateAnalyse}><FaCheck /> Creer (manuel)</button>
              <button className="med-btn med-btn-info" onClick={handleCreateAnalyseWithAi}><FaVials /> Creer avec IA</button>
              <button className="med-btn med-btn-secondary" onClick={() => setShowAnalyseCreateModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showAnalyseUpdateModal && selectedAnalyse && (
        <div className="med-modal-overlay" onClick={() => setShowAnalyseUpdateModal(false)}>
          <div className="med-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="med-modal-header">
              <h2><FaEdit /> Mise a jour analyse</h2>
              <button className="med-modal-close" onClick={() => setShowAnalyseUpdateModal(false)}><FaTimes /></button>
            </div>
            <div className="med-modal-body">
              <p className="med-modal-patient">
                Analyse: <strong>{selectedAnalyse.typeAnalyse}</strong> - Patient: <strong>{selectedAnalyse.patientPrenom} {selectedAnalyse.patientNom}</strong>
              </p>

              <div className="med-form-group">
                <label>Statut</label>
                <select value={analyseUpdateForm.statut || ""} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, statut: e.target.value }))}>
                  <option value="DEMANDEE">Demandee</option>
                  <option value="ECHANTILLON_PRELEVE">Echantillon preleve</option>
                  <option value="EN_ANALYSE">En analyse</option>
                  <option value="RESULTAT_DISPONIBLE">Resultat disponible</option>
                  <option value="VALIDE">Valide</option>
                </select>
              </div>

              <div className="med-form-group">
                <label>Progression (%)</label>
                <input type="number" min={0} max={100} value={analyseUpdateForm.progression ?? 0} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, progression: Number(e.target.value) }))} />
              </div>

              <div className="med-form-group">
                <label>Valeur resultat</label>
                <input type="text" value={analyseUpdateForm.resultatValeur || ""} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, resultatValeur: e.target.value }))} placeholder="Ex: HbA1c 6.7" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                <div className="med-form-group">
                  <label>Unite</label>
                  <input type="text" value={analyseUpdateForm.unite || ""} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, unite: e.target.value }))} placeholder="mg/dL" />
                </div>
                <div className="med-form-group">
                  <label>Intervalle reference</label>
                  <input type="text" value={analyseUpdateForm.intervalleReference || ""} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, intervalleReference: e.target.value }))} placeholder="4.0 - 6.0" />
                </div>
              </div>

              <div className="med-form-group">
                <label>Interpretation</label>
                <textarea rows={2} value={analyseUpdateForm.interpretation || ""} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, interpretation: e.target.value }))} />
              </div>

              <div className="med-form-group">
                <label>Conclusion</label>
                <textarea rows={2} value={analyseUpdateForm.conclusion || ""} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, conclusion: e.target.value }))} />
              </div>

              <div className="med-form-group">
                <label>Note timeline</label>
                <textarea rows={2} value={analyseUpdateForm.commentaireTimeline || ""} onChange={(e) => setAnalyseUpdateForm((prev) => ({ ...prev, commentaireTimeline: e.target.value }))} placeholder="Ajoute une etape de suivi" />
              </div>
            </div>
            <div className="med-modal-footer">
              <button className="med-btn med-btn-primary" onClick={handleUpdateAnalyse}><FaCheck /> Enregistrer</button>
              <button className="med-btn med-btn-secondary" onClick={() => setShowAnalyseUpdateModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Rendez-vous reschedule modal */}
      {showRescheduleModal && selectedRdvForReschedule && (
        <div className="med-modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="med-modal" onClick={e => e.stopPropagation()}>
            <div className="med-modal-header">
              <h2><FaCalendarAlt /> Replanifier le rendez-vous</h2>
              <button className="med-modal-close" onClick={() => setShowRescheduleModal(false)}><FaTimes /></button>
            </div>
            <div className="med-modal-body">
              <p>Patient: <strong>{selectedRdvForReschedule.patientPrenom} {selectedRdvForReschedule.patientNom}</strong></p>
              <p>Actuel: {selectedRdvForReschedule.dateRdv} à {selectedRdvForReschedule.heureRdv}</p>
              <div className="med-form-group">
                <label>Nouveau slot disponible</label>
                <select value={newSlotId || ""} onChange={e => setNewSlotId(Number(e.target.value))}>
                  <option value="">-- Sélectionner un slot --</option>
                  {availableSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>
                      {slot.dateDisponibilite} {slot.heureDebut} - {slot.heureFin}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="med-modal-footer">
              <button className="med-btn med-btn-primary" onClick={handleReschedule}><FaCheck /> Replanifier</button>
              <button className="med-btn med-btn-secondary" onClick={() => setShowRescheduleModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Create/Edit Modal */}
      {showPatientModal && (
        <div className="med-modal-overlay" onClick={() => setShowPatientModal(false)}>
          <div className="med-modal" onClick={e => e.stopPropagation()}>
            <div className="med-modal-header">
              <h2><FaUser /> {editingPatient ? "Modifier" : "Ajouter"} un Patient</h2>
              <button className="med-modal-close" onClick={() => setShowPatientModal(false)}><FaTimes /></button>
            </div>
            <div className="med-modal-body">
              <div className="med-form-group">
                <label>Prénom *</label>
                <input type="text" value={patientForm.prenom} onChange={e => setPatientForm(prev => ({ ...prev, prenom: e.target.value }))} placeholder="Prénom du patient" />
              </div>
              <div className="med-form-group">
                <label>Nom *</label>
                <input type="text" value={patientForm.nom} onChange={e => setPatientForm(prev => ({ ...prev, nom: e.target.value }))} placeholder="Nom du patient" />
              </div>
              <div className="med-form-group">
                <label>Email *</label>
                <input type="email" value={patientForm.email} onChange={e => setPatientForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemple.com" />
              </div>
              <div className="med-form-group">
                <label>{editingPatient ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}</label>
                <input type="password" value={patientForm.motDePasse} onChange={e => setPatientForm(prev => ({ ...prev, motDePasse: e.target.value }))} placeholder={editingPatient ? "Laisser vide pour garder l'actuel" : "Minimum 6 caractères"} />
              </div>
              <div className="med-form-group">
                <label>Date de naissance</label>
                <input type="date" value={patientForm.dateNaissance || ""} onChange={e => setPatientForm(prev => ({ ...prev, dateNaissance: e.target.value }))} />
              </div>
              <div className="med-form-group">
                <label>Téléphone</label>
                <input type="tel" value={patientForm.telephone || ""} onChange={e => setPatientForm(prev => ({ ...prev, telephone: e.target.value }))} placeholder="06 12 34 56 78" />
              </div>
            </div>
            <div className="med-modal-footer">
              <button className="med-btn med-btn-primary" onClick={handleSavePatient}>
                <FaCheck /> {editingPatient ? "Mettre à jour" : "Créer"}
              </button>
              <button className="med-btn med-btn-secondary" onClick={() => setShowPatientModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedecinDashboard;
