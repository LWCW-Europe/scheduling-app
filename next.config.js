const { execSync } = require('child_process');

function getCommitHash() {
  try {
    // Get the short commit hash
    const hash = execSync('git rev-parse --short HEAD', { 
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim();

    // Check if there are uncommitted changes
    let isDirty = false;
    try {
      const status = execSync('git status --porcelain', { 
        encoding: 'utf-8',
        cwd: process.cwd()
      }).trim();
      isDirty = status.length > 0;
    } catch {
      // If git status fails, assume not dirty
      isDirty = false;
    }

    return isDirty ? `${hash}-dirty` : hash;
  } catch (error) {
    // If git is not available or not a git repo, return unknown
    return 'unknown';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  eslint: {
    dirs: ["app", "db", "utils"],
  },
  env: {
    NEXT_PUBLIC_COMMIT_HASH: process.env.VERCEL_GIT_COMMIT_SHA 
      ? process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7) // Shorten Vercel's full hash
      : getCommitHash(),
  },
};

module.exports = nextConfig;
