import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique gradient based on a wallet address
 * Returns an array of 2-3 colors for the gradient
 */
export function generateGradientFromAddress(address: string): string[] {
  // Use the address to generate deterministic colors
  const hash = address.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Generate 3 hue values that are well-spaced
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 120) % 360;
  const hue3 = (hue1 + 240) % 360;
  
  // Use different parts of the address for saturation and lightness
  const sat1 = 65 + (Math.abs(hash % 20));
  const sat2 = 70 + (Math.abs((hash >> 8) % 20));
  const sat3 = 60 + (Math.abs((hash >> 16) % 20));
  
  const light1 = 50 + (Math.abs(hash % 15));
  const light2 = 55 + (Math.abs((hash >> 8) % 15));
  const light3 = 50 + (Math.abs((hash >> 16) % 15));
  
  return [
    `hsl(${hue1}, ${sat1}%, ${light1}%)`,
    `hsl(${hue2}, ${sat2}%, ${light2}%)`,
    `hsl(${hue3}, ${sat3}%, ${light3}%)`,
  ];
}

/**
 * Generates CSS gradient string from wallet address
 */
export function getGradientStyle(address: string): string {
  const colors = generateGradientFromAddress(address);
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
}

