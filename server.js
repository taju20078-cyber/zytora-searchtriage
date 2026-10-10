// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var port = process.env.PORT || 3e3;
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SearchIQ Triage Engine",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`SearchIQ server listening on port ${port}`);
});
