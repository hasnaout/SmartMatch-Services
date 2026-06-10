// server/index.js
const dotenv = require("dotenv");
dotenv.config();

const express       = require("express");
const cors          = require("cors");
const chatbotRouter = require("./chatbot");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares ──────────────────────────────
app.use(cors({
  origin:  "http://localhost:5173",
  methods: ["GET", "POST"],
}));
app.use(express.json());

// ── Routes ───────────────────────────────────
app.use("/api/chatbot", chatbotRouter);

// Health-check
app.get("/api/health", (req, res) => {
  const hasLLM = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
  res.json({
    status: "ok",
    llm:    hasLLM ? "connecté" : "fallback rule-based actif",
  });
});

// ── Démarrage ────────────────────────────────
app.listen(PORT, () => {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI    = !!process.env.OPENAI_API_KEY;

  console.log(`✅ Serveur chatbot démarré sur http://localhost:${PORT}`);

  if (hasAnthropic)   console.log("🤖 LLM : Anthropic Claude (Haiku) connecté");
  else if (hasOpenAI) console.log("🤖 LLM : OpenAI GPT-4o-mini connecté");
  else                console.log("⚠️  LLM : aucune clé API — fallback rule-based actif");
});