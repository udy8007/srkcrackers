/** Mobile APK download icon — phone + arrow + APK badge. */
export function ApkDownloadIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Phone body */}
      <rect
        x="5.5"
        y="1.5"
        width="13"
        height="21"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      {/* Speaker */}
      <rect x="10" y="3.25" width="4" height="1" rx="0.5" fill="currentColor" opacity="0.45" />
      {/* Screen */}
      <rect x="7" y="5.5" width="10" height="13.5" rx="1.25" fill="currentColor" opacity="0.08" />
      {/* Download arrow */}
      <path
        d="M12 8v4.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.75 11.25 12 13.5l2.25-2.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Download tray */}
      <path
        d="M8.5 15.25h7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* APK badge */}
      <rect x="7.25" y="17" width="9.5" height="3.75" rx="1.875" fill="#ffc300" />
      <text
        x="12"
        y="19.55"
        textAnchor="middle"
        fontSize="3.1"
        fontWeight="800"
        fill="#9d0208"
        fontFamily="system-ui, sans-serif"
      >
        APK
      </text>
    </svg>
  );
}
