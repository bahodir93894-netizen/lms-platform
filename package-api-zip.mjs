#!/usr/bin/env node
import archiver from "archiver";
import fs from "fs";
import path from "path";

const output = fs.createWriteStream("/home/project/lms-api.zip");
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`✅ lms-api.zip yaratildi (${archive.pointer()} bayt)`);
});

archive.on("error", (err) => { throw err; });
archive.pipe(output);

// Add the entire lms-api directory, excluding node_modules
archive.directory("/home/project/lms-api/", "lms-api", (entry) => {
  return !entry.name.includes("node_modules") && !entry.name.includes(".git");
});

archive.finalize();
