"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sparkyAvatarVariants = cva(
  "flex-shrink-0 inline-flex items-center justify-center",
  {
    variants: {
      size: {
        small: "w-10 h-10",
        medium: "w-16 h-16",
        large: "w-24 h-24",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

export interface SparkyAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sparkyAvatarVariants> {}

export function SparkyAvatar({
  size,
  className,
  ...props
}: SparkyAvatarProps) {
  return (
    <div
      className={cn(sparkyAvatarVariants({ size }), className)}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        aria-label="Sparky the electrician mascot"
      >
        {/* Hard Hat */}
        <ellipse cx="50" cy="28" rx="32" ry="12" fill="#F59E0B" />
        <rect x="20" y="24" width="60" height="14" rx="2" fill="#F59E0B" />
        <rect x="15" y="36" width="70" height="6" rx="2" fill="#D97706" />
        {/* Hat highlight */}
        <ellipse cx="50" cy="26" rx="20" ry="6" fill="#FCD34D" opacity="0.5" />

        {/* Face */}
        <circle cx="50" cy="58" r="24" fill="#FBBF24" />
        {/* Cheeks */}
        <circle cx="35" cy="62" r="4" fill="#F59E0B" opacity="0.4" />
        <circle cx="65" cy="62" r="4" fill="#F59E0B" opacity="0.4" />

        {/* Eyes */}
        <ellipse cx="40" cy="54" rx="5" ry="6" fill="white" />
        <ellipse cx="60" cy="54" rx="5" ry="6" fill="white" />
        <circle cx="41" cy="55" r="3" fill="#292524" />
        <circle cx="61" cy="55" r="3" fill="#292524" />
        {/* Eye shine */}
        <circle cx="42" cy="53" r="1.5" fill="white" />
        <circle cx="62" cy="53" r="1.5" fill="white" />

        {/* Eyebrows - friendly raised */}
        <path d="M34 48 Q40 45 46 48" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M54 48 Q60 45 66 48" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Smile */}
        <path d="M38 68 Q50 78 62 68" stroke="#92400E" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Lightning bolt badge on hat */}
        <path d="M52 20 L48 28 L52 28 L48 36 L56 26 L52 26 L56 20 Z" fill="#FFFBEB" />
      </svg>
    </div>
  );
}
