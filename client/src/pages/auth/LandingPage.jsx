import React from "react";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

// Images
import ph from "../../Assets/ph.jpg";
import vid from "../../Assets/vid.mp4";

// Icônes SVG
const UserIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
);

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
);

const LandingPage = () => {
  const navigate = useNavigate();

  const goToConnexion  = () => navigate("/login");
  const goToInscription = () => navigate("/register");

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className="header">
        <div className="logo-container">
          <span className="logo">SmartMatch</span>
        </div>

        <nav className="nav">
          <span onClick={() => scrollTo("services")}>Services</span>
          <span onClick={() => scrollTo("about")}>À Propos</span>
          <button className="btn-outline" onClick={goToConnexion}>
            Connexion
          </button>
          <button className="btn-primary" onClick={goToInscription}>
            Inscription
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <video src={vid} autoPlay muted loop playsInline />
        <div className="overlay"></div>
        <div className="hero-content">
          <h1>
            Une plateforme intelligente
            <br />
            <span>au service de vos besoins</span>
          </h1>
          <p>
            SmartMatch connecte entreprises, clients et prestataires grâce à des
            solutions digitales fiables, sécurisées et personnalisées.
          </p>
          <div className="hero-buttons">
            <button className="btn-hero-primary" onClick={goToInscription}>
              Commencer maintenant
            </button>
            <button className="btn-hero-outline" onClick={() => scrollTo("services")}>
              Découvrir les services
            </button>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="services">
        <div className="section-title">
          <h2>Nos Services</h2>
          <p>Des solutions complètes pour répondre à tous vos besoins</p>
        </div>

        <div className="cards">
          <div className="card">
            <div className="card-icon"><UserIcon /></div>
            <h3>Pour les Clients</h3>
            <ul>
              <li>Publier une demande de service en quelques clics</li>
              <li>Trouver des prestataires adaptés à vos besoins</li>
              <li>Recevoir des recommandations personnalisées</li>
              <li>Comparer profils, compétences et avis</li>
              <li>Communiquer directement via la messagerie</li>
              <li>Suivre l'état de vos demandes en temps réel</li>
            </ul>
          </div>

          <div className="card">
            <div className="card-icon"><BriefcaseIcon /></div>
            <h3>Pour les Prestataires</h3>
            <ul>
              <li>Créer un profil professionnel détaillé</li>
              <li>Mettre en avant vos compétences et services</li>
              <li>Recevoir des demandes ciblées selon votre profil</li>
              <li>Gérer votre disponibilité facilement</li>
              <li>Développer votre visibilité et votre clientèle</li>
              <li>Accéder à des outils de gestion intégrés</li>
            </ul>
          </div>

          <div className="card">
            <div className="card-icon"><StarIcon /></div>
            <h3>Notre Valeur Ajoutée</h3>
            <ul>
              <li>Système intelligent de recommandation</li>
              <li>Sélection basée sur compétences et localisation</li>
              <li>Plateforme sécurisée et facile à utiliser</li>
              <li>Gain de temps et qualité des prestations</li>
              <li>Support client réactif et disponible</li>
            </ul>
          </div>

          <div className="card">
            <div className="card-icon"><TargetIcon /></div>
            <h3>Notre Mission</h3>
            <p>
              Connecter les bonnes personnes, au bon moment, pour offrir des
              services efficaces, fiables et adaptés à chaque besoin.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about">
        <div className="about-wrapper">
          <div className="about-image">
            <img src={ph} alt="Solutions SmartMatch" />
            <div className="about-overlay">
              <h3>Solutions Complètes</h3>
              <p>Expertise & Innovation</p>
            </div>
          </div>

          <div className="about-content">
            <h2>Qui sommes-<span>nous</span></h2>
            <p>
              Bienvenue chez <strong>SmartMatch</strong>, votre partenaire de confiance
              pour connecter clients et prestataires de qualité.
            </p>
            <p>
              Nous proposons des solutions sur mesure garantissant performance,
              sécurité et efficacité pour chaque mission.
            </p>
            <div className="about-stats">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Clients satisfaits</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5+</div>
                <div className="stat-label">Années d'expérience</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">Taux de satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>SmartMatch</h4>
            <p>Votre plateforme de connexion entre clients et prestataires.</p>
          </div>
          <div className="footer-section">
            <h4>Liens Rapides</h4>
            <a href="/">Accueil</a>
            <a href="#services">Services</a>
            <a href="#about">À Propos</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Casablanca, Maroc</p>
            <p>contact@smartmatch.com</p>
            <p>+212 6XX-XXXXXX</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 SmartMatch. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;