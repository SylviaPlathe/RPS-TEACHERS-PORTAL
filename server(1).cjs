const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase is now the application's database.
// This server only serves the built Vite application.
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));

// Health check for Render.
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Let React Router/Vite handle client-side routes.
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
