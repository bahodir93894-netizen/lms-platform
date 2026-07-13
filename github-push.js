import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.argv[2] || process.env.GH_TOKEN;
const REPO_NAME = "lms-platform";
const PROJECT_DIR = "/home/project";

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "coverage",
]);

const IGNORE_FILES = new Set([
  "package-lock.json", ".env", ".env.local",
]);

function getAllFiles(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
        files.push(...getAllFiles(fullPath, baseDir));
      }
    } else if (!IGNORE_FILES.has(entry.name) && !entry.name.startsWith(".")) {
      try {
        files.push({
          path: relativePath,
          content: fs.readFileSync(fullPath, "utf-8"),
        });
      } catch { /* skip binary files */ }
    }
  }
  return files;
}

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.github.com",
      path: endpoint,
      method,
      headers: {
        "User-Agent": "lms-push-script",
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        "Content-Length": data ? Buffer.byteLength(data) : 0,
      },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("\n  📤 GitHub ga yuklash boshlanmoqda...\n");

  if (!TOKEN) {
    console.error("  ❌ Token topilmadi!");
    process.exit(1);
  }

  // 1. Get user info
  console.log("  🔑 Token tekshirilmoqda...");
  const userRes = await apiRequest("GET", "/user");
  if (userRes.status !== 200) {
    console.error(`  ❌ Token xato! Status: ${userRes.status}`);
    process.exit(1);
  }
  const username = userRes.data.login;
  console.log(`  ✅ ${username} - token ishlaydi`);

  // 2. Create repo
  console.log(`\n  📁 "${REPO_NAME}" repozitoriy yaratilmoqda...`);
  const createRes = await apiRequest("POST", "/user/repos", {
    name: REPO_NAME,
    description: "O'quv Markazi - Zamonaviy LMS Platforma",
    private: false,
    auto_init: true,
  });

  if (createRes.status === 201) {
    console.log("  ✅ Repo yaratildi!");
  } else if (createRes.status === 422) {
    console.log("  ⚠️  Repo allaqachon mavjud, yangilanmoqda...");
  } else {
    console.error(`  ❌ Xatolik: ${createRes.status}`);
    process.exit(1);
  }

  // 3. Get all files
  const files = getAllFiles(PROJECT_DIR);
  console.log(`  📄 ${files.length} ta fayl topildi`);

  // 4. Upload each file via contents API (simpler than git trees)
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileRes = await apiRequest("PUT", `/repos/${username}/${REPO_NAME}/contents/${file.path}`, {
      message: `Add ${file.path}`,
      content: Buffer.from(file.content, "utf-8").toString("base64"),
    });

    if (fileRes.status === 201 || fileRes.status === 200) {
      uploaded++;
    } else {
      errors++;
    }

    if ((i + 1) % 5 === 0 || i === files.length - 1) {
      process.stdout.write(`\r  📊 ${i + 1}/${files.length} ta fayl... (${uploaded} ok, ${errors} xato)`);
    }
  }

  console.log("\n\n  ✅ GitHub ga yuklandi!");
  console.log(`  🌐 https://github.com/${username}/${REPO_NAME}\n`);

  console.log("  📋 Endi o'z kompyuteringizda:");
  console.log(`  git clone https://github.com/${username}/${REPO_NAME}.git`);
  console.log(`  cd ${REPO_NAME}`);
  console.log("  npm install");
  console.log("  npx convex dev");
  console.log("  npm run dev\n");
}

main().catch((err) => console.error("  ❌ Xatolik:", err.message));
