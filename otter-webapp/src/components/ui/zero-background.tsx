import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ZeroBackgroundProps {
    className?: string;
}

export function ZeroBackground({ className }: ZeroBackgroundProps) {
    const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate which grid cell the mouse is over (reduced spacing)
        const col = Math.round((x - 8) / 16);
        const row = Math.round((y - 8) / 16);

        setHoveredPosition({ row, col });
    };

    const updateContainerSize = useCallback((element: HTMLDivElement | null) => {
        if (element) {
            const rect = element.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        }
    }, []);

    // Update container size on mount and resize
    useEffect(() => {
        const handleResize = () => {
            const element = document.querySelector('[data-zero-background]') as HTMLDivElement;
            if (element) {
                const rect = element.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };

        handleResize(); // Initial size
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseLeave = () => {
        setHoveredPosition(null);
    };

    const isHighlighted = (row: number, col: number) => {
        if (!hoveredPosition) return false;

        const { row: hoverRow, col: hoverCol } = hoveredPosition;

        // Calculate distance from hovered position
        const distance = Math.sqrt(
            Math.pow(row - hoverRow, 2) + Math.pow(col - hoverCol, 2)
        );

        // Create a more organic, varying shape using noise-like pattern
        const angle = Math.atan2(row - hoverRow, col - hoverCol);
        const noise = Math.sin(angle * 3) * 0.3 + Math.cos(angle * 2) * 0.2;
        const radius = 1.2 + noise; // Varying radius based on angle

        return distance <= radius;
    };

    return (
        <div
            ref={updateContainerSize}
            className={cn(
                "absolute inset-0 pointer-events-auto overflow-hidden",
                "z-0",
                className
            )}
            data-zero-background
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Grid pattern background */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '16px 16px',
                }}
            />

            {/* Zero characters positioned at grid points */}
            <div className="absolute inset-0">
                {Array.from({ length: Math.ceil(containerSize.height / 16) + 10 }, (_, i) => (
                    <div key={i} className="absolute">
                        {Array.from({ length: Math.ceil(containerSize.width / 16) + 10 }, (_, j) => (
                            <span
                                key={j}
                                className={cn(
                                    "absolute text-xs font-mono transition-colors duration-150",
                                    isHighlighted(i, j)
                                        ? "text-blue-500/60"
                                        : "text-gray-500/20"
                                )}
                                style={{
                                    left: `${j * 16 + 8}px`,
                                    top: `${i * 16 + 8}px`,
                                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                                    zIndex: 1,
                                    fontVariantNumeric: 'slashed-zero',
                                }}
                            >
                                0
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
