interface BrandLogoProps {
  collapsed?: boolean;
}

export default function BrandLogo({ collapsed = false }: BrandLogoProps) {
  return (
    <img
      src="/nextradev-logo.svg"
      alt="Nextradev Technologies"
      className={collapsed
        ? "h-12 w-12 shrink-0 rounded-xl object-cover object-left"
        : "h-[72px] w-[190px] max-w-full shrink object-contain"}
    />
  );
}
