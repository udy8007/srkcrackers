import Script from "next/script";

/** Noupe AI chat widget — replaces the built-in demo chatbot. */
export function NoupeEmbed() {
  return (
    <Script
      src="https://www.noupe.com/embed/019f30967aa0700080c53f9bb9b8a6e42c31.js"
      strategy="lazyOnload"
    />
  );
}
