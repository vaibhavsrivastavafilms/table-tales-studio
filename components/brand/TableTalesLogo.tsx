import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  TABLE_TALES_LOGO_ALT,
  TABLE_TALES_LOGO_PATH,
  TABLE_TALES_LOGO_SIZES,
  type TableTalesLogoSize,
} from "@/lib/brand/logo";

type TableTalesLogoProps = {
  size?: TableTalesLogoSize;
  className?: string;
  priority?: boolean;
};

export default function TableTalesLogo({
  size = "md",
  className,
  priority = false,
}: TableTalesLogoProps) {
  const dim = TABLE_TALES_LOGO_SIZES[size];

  return (
    <Image
      src={TABLE_TALES_LOGO_PATH}
      alt={TABLE_TALES_LOGO_ALT}
      width={dim.width}
      height={dim.height}
      priority={priority}
      className={cn("h-auto max-w-full object-contain", className)}
    />
  );
}
