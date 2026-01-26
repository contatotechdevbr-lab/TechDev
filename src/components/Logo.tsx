import logoImage from "@/assets/logo-techdev.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
  xl: "h-28"
};

export const Logo = ({
  size = "md",
  showText = false
}: LogoProps) => {
  return (
    <div className="flex items-center gap-3">
      <img 
        src={logoImage} 
        alt="TechDev Logo" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
};

export const LogoText = ({
  className = ""
}: {
  className?: string;
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img 
        src={logoImage} 
        alt="TechDev Logo" 
        className="h-32 md:h-40 lg:h-48 w-auto object-contain"
      />
    </div>
  );
};