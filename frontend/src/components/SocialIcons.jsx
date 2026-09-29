import React from 'react';
import { Globe, MessageCircle } from 'lucide-react';

export const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export const KickIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    {/* Kick's iconic block-K logo */}
    <path d="M4 3h5v6.5l4-6.5h5.5l-5.5 8.5 6 9.5H13.5L8.5 14v7H4V3z"/>
  </svg>
);

export const TikTokIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48 6.3 6.3 0 0 0 1.86-4.48v-6.5a8.28 8.28 0 0 0 4.84 1.54V7.27a4.85 4.85 0 0 1-.93-.58z"/>
  </svg>
);

export const TwitterXIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const YoutubeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const DiscordIcon = ({ className = "w-4 h-4" }) => (
  <MessageCircle className={className} />
);

export const OtherGlobeIcon = ({ className = "w-4 h-4" }) => (
  <Globe className={className} />
);

export const getSocialIconComponent = (platform) => {
  switch (platform?.toLowerCase()) {
    case 'instagram': return InstagramIcon;
    case 'kick': return KickIcon;
    case 'tiktok': return TikTokIcon;
    case 'twitter':
    case 'x': return TwitterXIcon;
    case 'youtube': return YoutubeIcon;
    case 'discord': return DiscordIcon;
    default: return OtherGlobeIcon;
  }
};
