import simpleGit from "simple-git";
import { execSync } from "child_process";

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error("❌ GitHub token talab qilinadi!");
    console.error("Usage: node github-push.mjs <github_token>");
    process.exit(1);
  }

  const repoName = "lms-api";
  const username = "bahodir93894-netizen";
  const repoUrl = `https://${token}@github.com/${username}/${repoName}.git`;

  console.log("\n  📤 LMS API - GitHub ga yuklash boshlanmoqda...\n");

  try {
    console.log("  🔑 Repozitoriy yaratilmoqda...");
    const createRes = execSync(
      `curl -s -X POST -H "Authorization: token ${token}" \
        -H "Content-Type: application/json" \
        -d '{"name":"${repoName}","description":"LMS REST API - Express.js + Convex","private":false}' \
        https://api.github.com/user/repos`,
      { encoding: "utf-8" }
    );
    console.log("  ✅ Repo yaratildi!\n");

    const cwd = "/home/project/lms-api";
    const git = simpleGit(cwd);
    
    const fileCount = execSync("find . -type f -not -path './node_modules/*' -not -path './.git/*' | wc -l", { 
      cwd,
      encoding: "utf-8" 
    }).trim();
    console.log(`  📄 ${fileCount} ta fayl topildi`);

    await git.init();
    await git.addConfig("user.name", "LMS API");
    await git.addConfig("user.email", "lms@example.com");
    await git.add(".");
    await git.commit("Initial commit: LMS REST API");
    await git.addRemote("origin", repoUrl);
    await git.push("origin", "main");

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
    process.exit(1);
  }
}

main();
