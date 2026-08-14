/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: { "2xl": "1400px" },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                /* AgentMarketplace — cheerful warm palette
                 * We keep the semantic names so existing className strings still work,
                 * but the values are remapped to a bright, welcoming home-buying palette. */
                obsidian: "#FCF9F0",   // was dark bg — now warm cream (page background)
                surface: "#FFFFFF",    // pure white cards on cream
                butter: "#F4E4C1",     // soft butter-yellow section bands (from the Victorian siding)
                sage: {
                    DEFAULT: "#6B8E5A",// leafy sage from the garden
                    hi: "#84A972",
                    lo: "#4F6F42",
                },
                gold: {                // cheerful sunny marigold — primary CTA
                    DEFAULT: "#E5A83E",
                    hi: "#F4BE55",
                    lo: "#B58021",
                },
                rose: "#E8869B",       // cheerful rose from the flower beds
                navy: {
                    DEFAULT: "#1E3A5F",// the buyer's navy blazer — trust & headings
                    hi: "#2C4E7A",
                },
                signal: "#DC6E4E",     // warm coral (still used for warnings)
                ink: "#1E3A5F",        // main text color (was near-white, now navy)
                fog: "#6B7280",        // muted body text
                hairline: "#E8DFC7",   // warm cream border
            },
            fontFamily: {
                display: ['"Cabinet Grotesk"', '"Space Grotesk"', "system-ui", "sans-serif"],
                sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
                mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
            },
            letterSpacing: {
                mega: "-0.035em",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "marquee": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-50%)" },
                },
                "reveal": {
                    from: { opacity: "0", transform: "translateY(16px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "float": {
                    "0%,100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-6px)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "marquee": "marquee 40s linear infinite",
                "reveal": "reveal .6s cubic-bezier(.2,.6,.2,1) both",
                "float": "float 6s ease-in-out infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
