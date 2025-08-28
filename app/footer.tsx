"use client";
import { getCommitHash } from "@/utils/git";

export default function Footer() {
  const commitHash = getCommitHash();
  const footerRightContent = process.env.NEXT_PUBLIC_FOOTER_RIGHT_HTML;

  return (
    <footer className="lg:fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 py-2 z-20 mt-auto">
      <div className="px-3 flex justify-between items-center text-xs text-gray-500">
        Version: {commitHash}
        {footerRightContent && (
          <div dangerouslySetInnerHTML={{ __html: footerRightContent }} />
        )}
      </div>
    </footer>
  );
}
