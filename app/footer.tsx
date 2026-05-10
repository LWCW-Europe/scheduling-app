"use client";
import { getCommitHash } from "@/utils/git";

export default function Footer() {
  const commitHash = getCommitHash();

  return (
    <footer className="lg:fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 py-2 z-20 mt-auto">
      <div className="px-3 flex justify-between items-center text-xs text-gray-500">
        Version: {commitHash}
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <a
            href="https://schellingboard.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            SchellingBoard
          </a>
          <span>·</span>
          <a
            href="https://github.com/LWCW-Europe/schellingboard/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Report a Bug
          </a>
        </div>
      </div>
    </footer>
  );
}
