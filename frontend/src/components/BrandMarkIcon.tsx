type BrandMarkIconProps = {
  className?: string;
};

export default function BrandMarkIcon({ className }: BrandMarkIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3.5 9 8.5-4.5L20.5 9 12 13.5 3.5 9Z" />
      <path d="M7 11.2v3.5c0 .6.4 1.1 1 1.4 1.1.5 2.5.9 4 .9s2.9-.4 4-.9c.6-.3 1-.8 1-1.4v-3.5" />
      <path d="M20.5 9v5.2" />
      <path d="M20.5 15.5v.1" />
    </svg>
  );
}
