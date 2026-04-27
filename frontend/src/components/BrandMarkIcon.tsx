type BrandMarkIconProps = {
  className?: string;
};

export default function BrandMarkIcon({ className }: BrandMarkIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 19.5 32 15l10 4.5-10 4.5-10-4.5Z" />
      <path d="M26 21.6v4.4" />
      <path d="M38 21.6v4.4" />
      <path d="M17.5 25.5c5.8 0 11 1.4 14.5 5v19c-3.5-3.6-8.7-5-14.5-5Z" />
      <path d="M46.5 25.5c-5.8 0-11 1.4-14.5 5v19c3.5-3.6 8.7-5 14.5-5Z" />
      <path d="M20.5 30.4c4.1.2 7.5 1.2 10.1 3" />
      <path d="M20.5 35.2c4.1.2 7.5 1.2 10.1 3" />
      <path d="M20.5 40c4.1.2 7.5 1.2 10.1 3" />
      <path d="M43.5 30.4c-4.1.2-7.5 1.2-10.1 3" />
      <path d="M43.5 35.2c-4.1.2-7.5 1.2-10.1 3" />
      <path d="M43.5 40c-4.1.2-7.5 1.2-10.1 3" />
      <path d="M32 50V36.5" />
      <path d="m28.6 39.8 3.4-6.3 3.4 6.3-3.4-.6Z" />
    </svg>
  );
}
