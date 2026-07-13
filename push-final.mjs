#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";

const token = process.argv[2];
if (!token) { console.error("Usage: node push-final.mjs <token>"); process.exit(1); }

const dir = "/home/project/lms-api";
const user = "bahodir93894-netizen";
const repo = "lms-api";

// Check files
const files = fs.readdirSync(dir + "/src/routes");
console.log("  📄 " + files.length + " route files found");

// Create repo
try {
  execSync('curl -s -X POST -H "Authorization: token ' + token + '" -H "Content-Type: application/json" -d \'{"name":"' + repo + '","private":false}\' https://api.github.com/user/repos', { stdio: "pipe", timeout: 15000 });
  console.log("  ✅ Repo created");
} catch(e) { console.log("  ℹ️  Repo may already exist"); }

// Use simple-git API
import("/home/project/node_modules/simple-git/dist/esm/index.js").then(async (mod) => {
  const git = mod.default(dir);
  try {
    await git.init();
    await git.addConfig("user.name", "LMS");
    await git.addConfig("user.email", "lms@example.com");
    await git.add(".");
    await git.commit("init");
    try { await git.addRemote("origin", "https://" + token + "@github.com/" + user + "/" + repo + ".git"); } catch {}
    await git.push("origin", "main");
    console.log("\n  ✅ GitHub ga yuklandi!");
    console.log("  🌐 https://github.com/" + user + "/" + repo + "\n");
  } catch(e) {
    console.error("  ❌ Push failed: " + e.message);
  }
}).catch(e => console.error("  ❌ Error: " + e.message));
