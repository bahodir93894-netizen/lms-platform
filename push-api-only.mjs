#!/usr/bin/env node
/**
 * Minimal push script for lms-api repo
 * Usage: node push-api-only.mjs <github_token>
 */
import { execSync } from "child_process";
import fs from "fs";

const token = process.argv[2];
if (!token) {
  console.error("Usage: node push-api-only.mjs <github_token>");
  process.exit(1);
}

const API_DIR = "/home/project/lms-api";
const username = "bahodir93894-netizen";
const repoName = "lms-api";
const repoUrl = `https://${token}@github.com/${username}/${repoName}.git`;

// Check files exist
const files = fs.readdirSync(API_DIR + "/src/routes");
console.log(`  📄 ${files.length} route files found`);

// Create GitHub repo
try {
  execSync(
    `curl -s -X POST -H "Authorization: token ${token}" \
      -H "Content-Type: application/json" \
      -d '{"name":"${repoName}","description":"LMS REST API - Express.js + Convex","private":false}' \
      https://api.github.com/user/repos`,
    { stdio: "pipe", timeout: 15000 }
  );
  console.log("  ✅ Repo created");
} catch {
  console.log("  ℹ️  Repo may already exist");
}

// Copy simple-git from main project
const gitMod = "/home/project/node_modules/simple-git";
if (fs.existsSync(gitMod)) {
  const dest = API_DIR + "/node_modules/simple-git";
  if (!fs.existsSync(dest)) {
    fs.symlinkSync(gitMod, dest, "dir");
  }
}

// Use execSync for git commands
const cmds = [
  `cd "${API_DIR}" && git init`,
  `cd "${API_DIR}" && git config user.name "LMS API"`,
  `cd "${API_DIR}" && git config user.email "lms@example.com"`,
  `cd "${API_DIR}" && git add -A`,
  `cd "${API_DIR}" && git commit -m "Initial commit: LMS REST API"`,
  `cd "${API_DIR}" && git remote add origin "${repoUrl}"`,
  `cd "${API_DIR}" && git push -u origin main`,
];

for (const cmd of cmds) {
  try {
    execSync(cmd, { stdio: "pipe", timeout: 30000 });
  } catch (e) {
    console.error(`  ❌ Failed: ${cmd}`);
    console.error(`  ${e.stderr?.toString().slice(0, 200) || e.message}`);
    process.exit(1);
  }
}

console.log(`\n  ✅ GitHub ga yuklandi!`);
console.log(`  🌐 https://github.com/${username}/${repoName}\n`);
