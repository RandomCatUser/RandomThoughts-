#!/usr/bin/env node
"use strict";
/*
 * Sync the blog's preview stylesheets into the Neutralino resources so the
 * Editor's live preview keeps the site chrome (common.css) and post styles
 * (posts.css) — inside the desktop app the server only serves resources/.
 */
const fs = require("fs");
const path = require("path");

const here = __dirname;
const pairs = [
  {
    src: path.join(here, "..", "docs", "assets", "css", "common.css"),
    dst: path.join(here, "resources", "docs", "assets", "css", "common.css"),
  },
  {
    src: path.join(here, "..", "docs", "posts", "posts.css"),
    dst: path.join(here, "resources", "docs", "posts", "posts.css"),
  },
];

for (const p of pairs) {
  if (!fs.existsSync(p.src)) {
    console.log("sync-docs: skip (missing source) " + p.src);
    continue;
  }
  fs.mkdirSync(path.dirname(p.dst), { recursive: true });
  fs.copyFileSync(p.src, p.dst);
  console.log("sync-docs: " + path.relative(here, p.dst));
}