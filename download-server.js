const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 4001;
const PROJECT_DIR = "/home/project";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
]);

function getAllFiles(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        files.push(...getAllFiles(fullPath, baseDir));
      }
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/download") {
    try {
      const archiver = require("archiver");
      const archive = archiver("zip", { zlib: { level: 9 } });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="lms-platform.zip"'
      );

      archive.pipe(res);
      archive.directory(PROJECT_DIR, "lms-platform", (entry) => {
        const name = entry.name.replace("lms-platform/", "");
        const firstPart = name.split("/")[0];
        return !IGNORE_DIRS.has(firstPart) && !name.startsWith(".");
      });

      await archive.finalize();
    } catch (err) {
      res.statusCode = 500;
      res.end("Error creating archive: " + err.message);
    }
  } else if (req.url === "/") {
    const files = getAllFiles(PROJECT_DIR);
    const fileCount = files.length;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Yuklab olish</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 20px; text-align: center; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  p { color: #666; margin-bottom: 1.5rem; }
  .btn { display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600; }
  .btn:hover { background: #1d4ed8; }
  .stats { margin-top: 2rem; font-size: 0.9rem; color: #888; }
</style></head>
<body>
  <h1>📦 O'quv Markazi — Loyiha Yuklash</h1>
  <p style="margin-top: -0.5rem">${fileCount} ta fayl, zip formatida</p>
  <a class="btn" href="/download">⬇ Yuklab olish</a>
  <div class="stats">
    <p>Loyiha: O'quv Markazi LMS</p>
    <p>Fayllar: ${fileCount} ta</p>
    <p>Port: ${PORT}</p>
  </div>
</body></html>
    `);
  } else {
    res.statusCode = 404;
    res.end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const files = getAllFiles(PROJECT_DIR);
  console.log(`\n  📦 Yuklab olish serveri ishga tushdi!`);
  console.log(`  ═══════════════════════════════════`);
  console.log(`  🌐 URL: http://localhost:${PORT}/`);
  console.log(`  📥 Yuklash: http://localhost:${PORT}/download`);
  console.log(`  📊 Jami fayllar: ${files.length} ta`);
  console.log(`  ═══════════════════════════════════\n`);
});
