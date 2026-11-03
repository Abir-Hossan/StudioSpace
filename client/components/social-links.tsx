// Platform destinations supplied by the project owner; these are not company profiles.
const platforms = [
  { name: "Facebook", href: "https://www.facebook.com/", path: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.885v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" },
  { name: "Instagram", href: "https://www.instagram.com/", path: "M7 0C3.134 0 0 3.134 0 7v10c0 3.866 3.134 7 7 7h10c3.866 0 7-3.134 7-7V7c0-3.866-3.134-7-7-7H7Zm0 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm11.5 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" },
  { name: "X (Twitter)", href: "https://x.com/?lang=en", path: "M18.9 2h3.3L15 10.2 23.5 22h-6.7l-5.2-7.2L5.3 22H2l8-9.2L1.8 2h6.8l4.7 6.6L18.9 2Zm-1.2 18h1.8L7.6 3.8H5.7L17.7 20Z" },
  { name: "YouTube", href: "https://www.youtube.com/", path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" },
];

export function SocialLinks() {
  return <div className="community-socials" role="group" aria-label="Social media platforms">
    {platforms.map(({ name, href, path }) => <a key={name} href={href} aria-label={name} title={`${name} (opens in a new tab)`} target="_blank" rel="noopener noreferrer">
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d={path} /></svg>
    </a>)}
  </div>;
}
