const { execSync } = require("child_process");

const token = process.argv[2];
if (!token) { console.error("Usage: node do-push.cjs <token>"); process.exit(1); }

const user = "bahodir93894-netizen";
const repo = "lms-api";
const dir = "/home/project/lms-api";

// Create repo
try {
  execSync('curl -s -X POST -H "Authorization: token ' + token + '" -H "Content-Type: application/json" -d \'{"name":"' + repo + '","private":false}\' https://api.github.com/user/repos', { stdio: "pipe", timeout: 15000 });
  console.log("Repo created/confirmed");
} catch(e) { console.log("Repo may already exist"); }

// Use simple-git from the API project's node_modules
const simpleGit = require(dir + "/node_modules/simple-git");
const git = simpleGit(dir);

async function push() {
  await git.init();
  await git.addConfig("user.name", "LMS API");
  await git.addConfig("user.email", "lms@example.com");
  await git.add(".");
  await git.commit("Initial commit");
  try { await git.addRemote("origin", "https://" + token + "@github.com/" + user + "/" + repo + ".git"); } catch(e) {}
  await git.push("origin", "main");
  console.log("Pushed! https://github.com/" + user + "/" + repo);
}

push().catch(e => console.error("Push failed:", e.message));
