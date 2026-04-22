import "./Footer.css";

const Footer = () => {
	return (
		<footer className="footer" id="contact">
			<div className="footer-content">
				<div className="footer-brand">
					<div className="footer-logo">
						<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect width="32" height="32" rx="12" fill="url(#footer-gradient)" />
							<path d="M8 20c2-6 4-6 6 0s4-6 6 0" stroke="#fff" strokeWidth="2" fill="none" />
							<defs>
								<linearGradient id="footer-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
									<stop stopColor="#0d6efd" />
									<stop offset="1" stopColor="#00c4ff" />
								</linearGradient>
							</defs>
						</svg>
					</div>
					<div>
						<h3>MediCare+</h3>
						<span>Gestion Médicale</span>
						<p style={{marginTop: '12px'}}>Solution complète de gestion médicale pour cliniques et laboratoires. Moderne, sécurisée et facile à utiliser.</p>
						<div className="footer-socials">
							<a href="#" aria-label="Facebook">
								<span className="social-circle">
									<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M10.5 9V6.75c0-.414.336-.75.75-.75h1.5V3.75h-1.5A3 3 0 007.5 6.75V9H6v2.25h1.5V15h2.25v-3.75H12L12.75 9H10.5z" fill="#e2e8f0"/></svg>
								</span>
							</a>
							<a href="#" aria-label="Twitter">
								<span className="social-circle">
									<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M15 4.5a6.75 6.75 0 01-2.25.75A3.375 3.375 0 0015 3a6.75 6.75 0 01-2.25.75A3.375 3.375 0 006.75 7.5c0 .25.025.5.075.75A9.6 9.6 0 013 3.75a3.375 3.375 0 001.05 4.5A3.375 3.375 0 013 8.25v.075A3.375 3.375 0 006.75 11.25a6.75 6.75 0 01-4.5 1.5c.75.5 1.5.75 2.25.75A9.6 9.6 0 0015 4.5z" fill="#e2e8f0"/></svg>
								</span>
							</a>
							<a href="#" aria-label="LinkedIn">
								<span className="social-circle">
									<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M6.75 6.75v6.75H4.5V6.75h2.25zm-1.125-1.125a1.125 1.125 0 110-2.25 1.125 1.125 0 010 2.25zm3.375 1.125v6.75h2.25V10.5c0-1.125.75-1.875 1.5-1.875s1.5.75 1.5 1.875v3.75h2.25V10.5c0-2.25-1.5-3.375-3.375-3.375s-3.375 1.125-3.375 3.375z" fill="#e2e8f0"/></svg>
								</span>
							</a>
							<a href="#" aria-label="Instagram">
								<span className="social-circle">
									<svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="3.375" stroke="#e2e8f0" strokeWidth="1.5"/><rect x="3.75" y="3.75" width="10.5" height="10.5" rx="3.75" stroke="#e2e8f0" strokeWidth="1.5"/><circle cx="13.125" cy="4.875" r=".375" fill="#e2e8f0"/></svg>
								</span>
							</a>
						</div>
					</div>
				</div>
				<div className="footer-links">
					<div>
						<h4 style={{fontWeight: 'bold'}}>Liens rapides</h4>
						<a href="#accueil">Accueil</a>
						<a href="#fonctionnalites">Fonctionnalités</a>
						<a href="#profils">Profils</a>
						<a href="#tarifs">Tarifs</a>
						<a href="#apropos">À propos</a>
					</div>
					<div>
						<h4 style={{fontWeight: 'bold'}}>Support</h4>
						<a href="#">Centre d'aide</a>
						<a href="#">Documentation</a>
						<a href="#">FAQ</a>
						<a href="#">Politique de confidentialité</a>
						<a href="#">Conditions d'utilisation</a>
					</div>
					<div>
						<h4 style={{fontWeight: 'bold'}}>Contact</h4>
						<div className="footer-contact">
							<span>📍 123 Avenue de la Santé, Tunis, Tunisie</span>
							<span>📞 +216 71 123 456</span>
							<span>✉️ contact@medicare-plus.tn</span>
						</div>
					</div>
				</div>
			</div>
			<div className="footer-bottom">
				<span>© 2026 MediCare+. Tous droits réservés. Développé avec <span style={{color:'#ec4899'}}>❤</span> en Tunisie</span>
				<div className="footer-legal">
					<a href="#">Mentions légales</a>
					<a href="#">Cookies</a>
					<a href="#">Plan du site</a>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
