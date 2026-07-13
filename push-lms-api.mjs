#!/usr/bin/env node
import simpleGit from "/home/project/node_modules/simple-git/dist/esm/index.js";
import { execSync } from "child_process";
import fs from "fs";

const token = process.argv[2];
if (!token) { console.error("Usage: node push-lms-api.mjs <token>"); process.exit(1); }

const API_DIR = "/home/project/lms-api";
const username = "bahodir93894-netizen";
const repoName = "lms-api";
const repoUrl = `https://${token}@github.com/${username}/${repoName}.git`;

// Check files
const files = fs.readdirSync(API_DIR + "/src/routes");
console.log(`  📄 ${files.length} route files found`);

// Create repo
try {
  execSync(
    `curl -s -X POST -H "Authorization: token ${token}" \
      -H "Content-Type: application/json" \
      -d '{"name":"${repoName}","description":"LMS REST API - Express.js + Convex","private":false}' \
      https://api.github.com/user/repos`,
    { stdio: "pipe", timeout: 15000 }
  );
  console.log("  ✅ Repo created");
} catch { console.log("  ℹ️  Repo may already exist"); }

// Git push using simple-git (npm library, not git binary)
const git = simpleGit(API_DIR);
await git.init();
await git.addConfig("user.name", "LMS API");
await git.addConfig("user.email", "lms@example.com");
await git.add(".");
await git.commit("Initial commit: LMS REST API");

try { await git.addRemote("origin", repoUrl); } catch {}
await git.push("origin", "main");

console.log(`\n  ✅ GitHub ga yuklandi!`);
console.log(`  🌐 https://github.com/${username}/${repoName}\n`);
