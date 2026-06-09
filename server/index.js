// server/index.js  (ou app.js — point d'entrée principal)
const express = require("express");
const cors = require("cors");
const chatbotRouter = require("./chatbot");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares ──────────────────────────────
app.use(cors({
  origin: "http://localhost:5173", // URL de votre front Vite — adaptez si besoin
  methods: ["GET", "POST"],
}));
app.use(express.json());

// ── Routes ───────────────────────────────────
app.use("/api/chatbot", chatbotRouter);

// Health-check rapide
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── Démarrage ────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Serveur chatbot démarré sur http://localhost:${PORT}`);
});