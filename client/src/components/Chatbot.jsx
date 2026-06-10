// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import robotImg from '../assets/robot1.png';
import { FaRocket, FaTag, FaTools, FaEnvelope } from "react-icons/fa";

// ─────────────────────────────────────────────
//  Configuration
// ─────────────────────────────────────────────
const API_URL = "http://localhost:5001/api/chatbot";

// Identifiant de session unique par onglet — permet la mémoire de conversation
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const QUICK_SUGGESTIONS = [
  { label: <><FaRocket /> Comment ça marche</>,   text: "Comment fonctionne SmartMatch ?" },
  { label: <><FaTag />    Tarifs</>,              text: "Quels sont vos tarifs ?" },
  { label: <><FaTools />  Devenir prestataire</>, text: "Je suis prestataire, comment m'inscrire ?" },
  { label: <><FaEnvelope /> Nous contacter</>,    text: "Comment vous contacter ?" },
];

// ─────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────
export default function Chatbot() {
  const [isOpen, setIsOpen]               = useState(false);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Message de bienvenue à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        setMessages([{
          id:   Date.now(),
          from: "bot",
          text: "Bonjour ! Je suis l'assistant SmartMatch. Je peux vous aider à comprendre comment fonctionne la plateforme, nos tarifs, ou comment rejoindre notre réseau de prestataires.",
        }]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Envoi du message ──────────────────────
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now(), from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    setIsTyping(true);

    try {
      const res = await fetch(API_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        // sessionId transmis pour activer la mémoire de conversation côté serveur
        body: JSON.stringify({ message: trimmed, sessionId: SESSION_ID }),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "bot", text: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id:   Date.now() + 1,
          from: "bot",
          text: "Une erreur est survenue. Vérifiez votre connexion et réessayez.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Rendu ─────────────────────────────────
  return (
    <>
      {/* Bulle flottante */}
      <button
        className={`chat-bubble ${isOpen ? "chat-bubble--open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Ouvrir le chat"
      >
        {isOpen ? "✕" : <img src={robotImg} alt="bot" style={{ width: "34px", height: "34px", objectFit: "contain" }} />}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="chat-window" role="dialog" aria-label="Assistant SmartMatch">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header__info">
              <img src={robotImg} alt="SmartMatch" className="chat-header__avatar" />
              <div>
                <p className="chat-header__name">Assistant SmartMatch</p>
                <p className="chat-header__status">
                  <span className="chat-header__dot" />
                  En ligne
                </p>
              </div>
            </div>
            <button
              className="chat-header__close"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Zone de messages */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg chat-msg--${msg.from}`}>
                {msg.text}
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="chat-msg chat-msg--bot">
                <span className="typing-indicator">
                  <span /><span /><span />
                </span>
              </div>
            )}

            {/* Suggestions rapides */}
            {showSuggestions && messages.length > 0 && (
              <div className="chat-suggestions">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    className="chat-suggestion-btn"
                    onClick={() => sendMessage(s.text)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Écrivez votre message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              aria-label="Envoyer"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
