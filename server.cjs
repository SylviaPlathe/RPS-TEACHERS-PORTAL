const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "portal-db.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Get the shared database
app.get("/api/db", (req, res) => {
  try {
    if (!fs.existsSync(dataFile)) {
      return res.json(null);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not read database" });
  }
});

// Save the shared database
app.put("/api/db", (req, res) => {
  try {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(req.body, null, 2),
      "utf8"
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save database" });
  }
});

// Serve the built Vite application
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));

// Handle Vite/React routes
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
