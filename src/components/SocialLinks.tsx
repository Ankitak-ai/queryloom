
import React from "react";
import { Linkedin, Twitter } from "lucide-react";

const socials = [
  {
    href: "https://www.linkedin.com/company/queryloomai/",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    href: "https://x.com/Queryloomai",
    label: "X / Twitter",
    icon: Twitter,
  },
];

const SocialLinks = () => (
  <div className="flex gap-4 justify-center py-6">
    {socials.map(({ href, label, icon: Icon }) => (
      <a
        key={href}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="text-gray-600 hover:text-purple-700 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
      >
        <Icon size={28} />
      </a>
    ))}
  </div>
);

export default SocialLinks;
