const express = require("express");
const cors = require("cors");
const path = require("path");
const { securityHeaders, apiLimiter, loginLimiter } = require("./middlewares/security");
const app = express();
app.use(securityHeaders);
app.use(cors());
app.use(express.json());
app.use("/api", apiLimiter);
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/api/status", (req, res) => res.json({ status: "ok", ambiente: process.env.NODE_ENV || "development" }));
app.post("/api/login", loginLimiter, (req, res) => {
  const { email, senha } = req.body;
  if (email === "demo@demo.com" && senha === "123456") return res.json({ mensagem: "Login OK" });
  res.status(401).json({ erro: "Credenciais invalidas" });
});
app.get("/api/erro", (req, res) => { throw new Error("Erro simulado"); });
app.use((req, res) => res.status(404).json({ erro: "Nao encontrada" }));
app.use((err, req, res, next) => {
  console.error("[ERRO]", err.message);
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({ erro: isProd ? "Erro interno" : err.message });
});
module.exports = app;
