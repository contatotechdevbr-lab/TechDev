import logoImage from "@/assets/logo-techdev.png";
interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}
const sizeClasses = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
  xl: "h-24"
};
export const Logo = ({
  size = "md",
  showText = false
}: LogoProps) => {
  return <div className="flex items-center gap-3">
      
      {showText && <span className="font-logo font-bold text-white">
          tech<span className="text-primary">dev</span>
        </span>}
    </div>;
};
export const LogoText = ({
  className = ""
}: {
  className?: string;
}) => {
  return <div className={`flex flex-col items-center ${className}`}>
      <span className="text-3xl text-primary font-bold mb-1">&lt;/&gt;</span>
      <span className="font-logo text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
        <span className="text-white">tech</span>
        <span className="text-primary">dev</span>
      </span>
    </div>;
};