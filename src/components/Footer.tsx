import { Linkedin, Twitter, Instagram, Facebook, Mail, ExternalLink } from "lucide-react";

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "X (Twitter)" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
];

const footerLinks = [
  {
    title: "Contest",
    links: [
      { label: "Rules & Guidelines", href: "/components/ContestRules.tsx" },
      { label: "Prizes", href: "#" },
      { label: "FAQ", href: "https://legroupeds.com/community" },
      { label: "Terms & Conditions", href: "https://legroupeds.com/terms-and-conditions" },
    ],
  },
  {
    title: "Events",
    links: [
      { label: "2026 Roadmap", href: "https://legroupeds.com/events", external: true },
      { label: "Applied AI Bootcamp", href: "#" },
      { label: "AI Ethics & Governance", href: "#" },
      { label: "Leadership Summit", href: "#" },
    ],
  },
  {
    title: "DS Consortium",
    links: [
      { label: "About Us", href: "https://legroupeds.com/about" },
      { label: "Our Mission", href: "https://legroupeds.com/services/knowledge-lab" },
      { label: "Contact", href: "https://legroupeds.com/contact" },
      { label: "Privacy Policy", href: "https://legroupeds.com/privacy" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="font-display text-lg font-bold text-primary-foreground">DS</span>
              </div>
              <div>
                <p className="font-display text-lg font-semibold">DS Consortium</p>
                <p className="text-xs text-muted-foreground">AI Readiness Initiative</p>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Positioning institutions at the forefront of AI transformation through education,
              collaboration, and responsible innovation.
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm font-medium">Stay updated</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90">
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold">{column.title}</h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {link.label}
                      {link.external && (
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DS Consortium. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Part of the{" "}
            <a href="#" className="font-medium text-foreground hover:underline">
              Are You AI Ready?
            </a>{" "}
            Campaign
          </p>
        </div>
      </div>
    </footer>
  );
};
