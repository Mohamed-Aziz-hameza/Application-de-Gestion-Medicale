import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStethoscope, FaUser, FaIdCard, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import { loginMedecinAdmin, setToken, setUser } from "../services/api";
import logo from "../assets/logo.png";

import "./PatientRegister.css";

const DoctorLogin: React.FC = () => {
	const [nom, setNom] = useState("");
	const [prenom, setPrenom] = useState("");
	const [id, setId] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!nom || !prenom || !id || !password) {
			setError("Veuillez remplir tous les champs.");
			return;
		}
		if (isNaN(Number(id))) {
			setError("L'identifiant doit être un nombre.");
			return;
		}
		setLoading(true);
		try {
			const res = await loginMedecinAdmin({ nom, prenom, id: Number(id), motDePasse: password });
			setToken(res.token);
			setUser(res);
			navigate("/profile");
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Erreur de connexion");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="patient-login-root">
			{/* Colonne gauche : fond bleu, logo, titre, sous-titre, liste */}
			<div className="patient-login-left" style={{ background: "linear-gradient(135deg, #0b5ed7 0%, #0ea5e9 100%)", color: "#fff", position: "relative", overflow: "hidden" }}>
				{/* Overlay image médecin floue */}
				
				<div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 38 }}>
					<img src={logo} alt="MediCare+" style={{ width: 54, height: 54, borderRadius: 14, background: '#fff', objectFit: 'cover', boxShadow: '0 4px 16px #0b5ed722' }} />
					<div>
						<h3 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>MediCare+</h3>
						<span style={{ fontSize: 15, color: '#e0e7ef' }}>Gestion Médicale</span>
					</div>
				</div>
				{/* Bloc espace médecin */}
				<div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.13)', borderRadius: 16, padding: '14px 28px', display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
					<span style={{ background: 'linear-gradient(135deg, #0b5ed7 0%, #0ea5e9 100%)', color: '#fff', borderRadius: 12, padding: 10, fontSize: 22, display: 'flex', alignItems: 'center' }}><FaStethoscope /></span>
					<div>
						<div style={{ fontWeight: 700, fontSize: 18 }}>Espace Médecin</div>
						<div style={{ fontSize: 14, color: '#e0e7ef' }}>Bienvenue, Docteur</div>
					</div>
				</div>
				<h1 style={{ fontWeight: 900, fontSize: 32, margin: '0 0 10px', color: '#fff', zIndex: 1 }}>Gérez vos patients et consultations en toute simplicité</h1>
				<ul style={{ margin: 0, padding: 0, listStyle: 'none', zIndex: 1, color: '#fff', fontSize: 18, fontWeight: 500 }}>
					<li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
						<span style={{ color: '#fff', fontSize: 20 }}>✔</span> Dossiers médicaux numériques complets
					</li>
					<li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
						<span style={{ color: '#fff', fontSize: 20 }}>✔</span> Gestion intelligente des rendez-vous
					</li>
					<li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
						<span style={{ color: '#fff', fontSize: 20 }}>✔</span> Analyses médicales avec IA intégrée
					</li>
				</ul>
			</div>

			{/* Colonne droite : carte blanche, icône, titre, sous-titre, formulaire */}
			<div className="patient-login-right" style={{ background: 'linear-gradient(90deg, #f6fbff 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<form className="patient-login-form" onSubmit={handleSubmit} style={{ boxShadow: '0 4px 32px rgba(15,23,42,0.10)', borderRadius: 18, padding: '44px 38px 32px 38px', maxWidth: 440, width: '100%' }}>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
						<span style={{ background: 'linear-gradient(135deg, #0b5ed7 0%, #0ea5e9 100%)', color: '#fff', borderRadius: 16, padding: 16, fontSize: 38, display: 'flex', alignItems: 'center', marginBottom: 8 }}><FaStethoscope /></span>
						<h1 style={{ fontWeight: 900, fontSize: 28, margin: 0, color: '#222' }}>Connexion Médecin</h1>
						<p style={{ color: '#475569', margin: '8px 0 0', fontSize: 15 }}>Accédez à votre espace professionnel</p>
					</div>

					<label style={{ fontWeight: 600, color: '#222', fontSize: 15, marginBottom: 6, display: 'block', width: '100%' }}>Nom</label>
					<div style={{ width: '100%', position: 'relative', marginBottom: 12 }}>
						<span style={{ position: 'absolute', left: 14, top: 13, color: '#b0b7c3', fontSize: 16 }}><FaUser /></span>
						<input
							type="text"
							placeholder="Votre nom"
							value={nom}
							onChange={e => setNom(e.target.value)}
							autoComplete="family-name"
							style={{ width: '100%', paddingLeft: 38 }}
						/>
					</div>

					<label style={{ fontWeight: 600, color: '#222', fontSize: 15, marginBottom: 6, display: 'block', width: '100%' }}>Prénom</label>
					<div style={{ width: '100%', position: 'relative', marginBottom: 12 }}>
						<span style={{ position: 'absolute', left: 14, top: 13, color: '#b0b7c3', fontSize: 16 }}><FaUser /></span>
						<input
							type="text"
							placeholder="Votre prénom"
							value={prenom}
							onChange={e => setPrenom(e.target.value)}
							autoComplete="given-name"
							style={{ width: '100%', paddingLeft: 38 }}
						/>
					</div>

					<label style={{ fontWeight: 600, color: '#222', fontSize: 15, marginBottom: 6, display: 'block', width: '100%' }}>Identifiant (ID)</label>
					<div style={{ width: '100%', position: 'relative', marginBottom: 12 }}>
						<span style={{ position: 'absolute', left: 14, top: 13, color: '#b0b7c3', fontSize: 16 }}><FaIdCard /></span>
						<input
							type="text"
							placeholder="Votre identifiant numérique"
							value={id}
							onChange={e => setId(e.target.value)}
							style={{ width: '100%', paddingLeft: 38 }}
						/>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<label style={{ fontWeight: 600, color: '#222', fontSize: 15, marginBottom: 6 }}>Mot de passe</label>
						<span style={{ fontSize: 14, color: '#0b5ed7', cursor: 'pointer' }} onClick={() => alert('Mot de passe oublié ?')}>Mot de passe oublié ?</span>
					</div>
					<div style={{ width: '100%', position: 'relative', marginBottom: 12 }}>
						<span style={{ position: 'absolute', left: 14, top: 13, color: '#b0b7c3', fontSize: 16 }}><FaLock /></span>
						<input
							type={showPassword ? "text" : "password"}
							placeholder="••••••••"
							value={password}
							onChange={e => setPassword(e.target.value)}
							autoComplete="current-password"
							style={{ width: '100%', paddingLeft: 38 }}
						/>
						<span onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 14, top: 13, cursor: 'pointer', color: '#0b5ed7', fontSize: 18 }}>
							{showPassword ? <FaEyeSlash /> : <FaEye />}
						</span>
					</div>

					{error && <div className="error">{error}</div>}

					<button type="submit" disabled={loading} style={{ background: 'linear-gradient(90deg, #0d6efd 0%, #0ea5e9 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', width: '100%', fontWeight: 700, fontSize: 17, marginBottom: 18, boxShadow: '0 8px 24px rgba(13,110,253,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
						{loading ? 'Connexion...' : 'Se connecter'} {!loading && <FaArrowRight />}
					</button>

					<hr style={{ width: '100%', margin: '18px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />

					<div style={{ width: "100%", textAlign: "center", marginTop: 10, fontSize: 15 }}>
						Nouveau praticien ? <span style={{ color: "#0b5ed7", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate('/doctor-register')}>Créer un compte</span>
					</div>
					<div style={{ fontSize: 14, color: '#64748b', marginTop: 10, textAlign: 'center', width: '100%', cursor: 'pointer' }} onClick={() => navigate('/')}>← Retour à l'accueil</div>
				</form>
			</div>
		</div>
	);
};

export default DoctorLogin;
