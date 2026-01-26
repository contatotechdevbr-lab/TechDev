interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeConfig = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 28, text: "text-2xl" },
  lg: { icon: 36, text: "text-3xl" },
  xl: { icon: 48, text: "text-4xl" }
};

const LogoIcon = ({ size = 28 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
  >
    {/* < symbol */}
    <path 
      d="M9 6L3 12L9 18" 
      stroke="hsl(205 85% 55%)" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* / symbol */}
    <path 
      d="M14 4L10 20" 
      stroke="hsl(205 85% 55%)" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    {/* > symbol */}
    <path 
      d="M15 6L21 12L15 18" 
      stroke="hsl(205 85% 55%)" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const Logo = ({ size = "md" }: LogoProps) => {
  const config = sizeConfig[size];
  
  return (
    <div className="flex items-center gap-2">
      <LogoIcon size={config.icon} />
      <span className={`font-logo font-bold ${config.text} tracking-tight`}>
        <span className="text-foreground">tech</span>
        <span className="text-primary">dev</span>
      </span>
    </div>
  );
};

export const LogoText = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <LogoIcon size={56} />
      <span className="font-logo text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
        <span className="text-foreground">tech</span>
        <span className="text-primary">dev</span>
      </span>
    </div>
  );
};