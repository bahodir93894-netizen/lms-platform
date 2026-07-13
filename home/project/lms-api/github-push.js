import simpleGit from "simple-git";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error("❌ GitHub token talab qilinadi!");
    console.error("Usage: node github-push.js <github_token>");
    process.exit(1);
  }

  const repoName = "lms-api";
  const username = "bahodir93894-netizen";
  const repoUrl = `https://${token}@github.com/${username}/${repoName}.git`;

  console.log("\n  📤 LMS API - GitHub ga yuklash boshlanmoqda...\n");

  try {
    // Create GitHub repo
    console.log("  🔑 Repozitoriy yaratilmoqda...");
    const createRes = execSync(
      `curl -s -X POST -H "Authorization: token ${token}" \
        -H "Content-Type: application/json" \
        -d '{"name":"${repoName}","description":"LMS REST API - Express.js + Convex","private":false}' \
        https://api.github.com/user/repos`,
      { encoding: "utf-8" }
    );
    console.log("  ✅ Repo yaratildi!\n");

    const git = simpleGit("/home/project/lms-api");
    
    // Count files
    const fileCount = execSync("find . -type f -not -path './node_modules/*' -not -path './.git/*' | wc -l", { 
      cwd: "/home/project/lms-api",
      encoding: "utf-8" 
    }).trim();
    console.log(`  📄 ${fileCount} ta fayl topildi`);

    // Git init
    await git.init();
    await git.addConfig("user.name", "LMS API");
    await git.addConfig("user.email", "lms@example.com");
    
    // Add all files
    await git.add(".");
    await git.commit("Initial commit: LMS REST API");
    
    // Add remote and push
    await git.addRemote("origin", repoUrl);
    await git.branch([" -M", " main"]);
    
    // Push with progress
    await git.push("origin", "main", ["--progress"], (progress) => {
      const match = progress.match(/(\d+)\/(\d+)/);
      if (match) {
        process.stdout.write(`  📊 ${match[1]}/${match[2]} ta fayl...\r`);
      }
    });

    console.log("\n  ✅ GitHub ga yuklandi!");
    console.log(`  🌐 https://github.com/${username}/${repoName}\n`);
    console.log("  📋 O'z kompyuteringizda:");
    console.log(`  git clone https://github.com/${username}/${repoName}.git`);
    console.log("  cd lms-api");
    console.log("  cp .env.example .env");
    console.log("  npm install");
    console.log("  npm run dev\n");

  } catch (err) {
    console.error("\n  ❌ Xatolik:", err.message);
    if (err.message?.includes("422")) {
      console.error("  Repo allaqachon mavjud.");
    }
    process.exit(1);
  }
}

main();
