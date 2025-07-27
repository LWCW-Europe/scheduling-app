"use client";
import { getCommitHash } from "@/utils/git";

export default function Footer() {
  const commitHash = getCommitHash();
  const footerRightContent = process.env.NEXT_PUBLIC_FOOTER_RIGHT_HTML;

  return (
    <footer className="sm:fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 py-2 z-20">
      <div className="px-3 flex justify-between items-center">
        <span className="text-xs text-gray-500">Version: {commitHash}</span>
        {footerRightContent && (
          <div
            className="text-xs text-gray-500"
            dangerouslySetInnerHTML={{ __html: footerRightContent }}
          />
        )}
      </div>
    </footer>
  );
}
