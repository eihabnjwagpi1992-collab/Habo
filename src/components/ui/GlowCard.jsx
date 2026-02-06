import React from 'react';
import { cn } from "@/lib/utils";

export default function GlowCard({ 
  children, 
  className, 
  glowColor = "cyan",
  hover = true,
  ...props 
}) {
  const glowColors = {
    cyan: "hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]",
    purple: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    green: "hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    orange: "hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]",
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-[#1a1a2e] to-[#12121a] border border-white/5 rounded-xl",
        "transition-all duration-300",
        hover && glowColors[glowColor],
        hover && "hover:border-white/10 hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}