import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ZeroBackgroundProps {
    className?: string;
}

export function ZeroBackground({ className }: ZeroBackgroundProps) {
    const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0, top: 0, left: 0 });

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
            // Get the scrollable parent to position relative to it
            const scrollableParent = element.closest('.overflow-y-auto');
            if (scrollableParent) {
                const parentRect = scrollableParent.getBoundingClientRect();
                setContainerSize({
                    width: parentRect.width,
                    height: parentRect.height,
                    top: parentRect.top,
                    left: parentRect.left
                });
            } else {
                const rect = element.getBoundingClientRect();
                setContainerSize({
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left
                });
            }
        }
    }, []);

    // Update container size on mount and resize
    useEffect(() => {
        const handleResize = () => {
            const element = document.querySelector('[data-zero-background]') as HTMLDivElement;
            if (element) {
                const scrollableParent = element.closest('.overflow-y-auto');
                if (scrollableParent) {
                    const parentRect = scrollableParent.getBoundingClientRect();
                    setContainerSize({
                        width: parentRect.width,
                        height: parentRect.height,
                        top: parentRect.top,
                        left: parentRect.left
                    });
                } else {
                    const rect = element.getBoundingClientRect();
                    setContainerSize({
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        left: rect.left
                    });
                }
            }
        };

        handleResize(); // Initial size
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize);
        };
    }, []);

    const handleMouseLeave = () => {
        setHoveredPosition(null);
    };

    const getOpacity = (row: number, col: number) => {
        if (!hoveredPosition) return 0.12; // Increased base opacity when not hovering

        const { row: hoverRow, col: hoverCol } = hoveredPosition;

        // Calculate distance from hovered position
        const distance = Math.sqrt(
            Math.pow(row - hoverRow, 2) + Math.pow(col - hoverCol, 2)
        );

        // Create a more organic, varying shape using noise-like pattern
        const angle = Math.atan2(row - hoverRow, col - hoverCol);
        const noise = Math.sin(angle * 3) * 0.3 + Math.cos(angle * 2) * 0.2;
        const radius = 2.5 + noise; // Reduced radius to 2.5 with variation

        if (distance <= radius) {
            // Create smooth falloff from center to edge
            const normalizedDistance = distance / radius;
            // Use exponential falloff for more realistic flashlight effect
            const opacity = Math.exp(-normalizedDistance * 2.5) * 1.0; // Increased max opacity to 1.0
            return Math.max(opacity, 0.2); // Increased minimum opacity to 0.2
        }

        return 0.08; // Slightly increased base opacity
    };

    return (
        <div
            ref={updateContainerSize}
            className={cn(
                "fixed pointer-events-none overflow-hidden select-none",
                "z-0",
                className
            )}
            data-zero-background
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                top: containerSize.top,
                left: containerSize.left,
                width: containerSize.width,
                height: containerSize.height,
            }}
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
                                className="absolute text-xs font-mono transition-all duration-300"
                                style={{
                                    left: `${j * 16 + 8}px`,
                                    top: `${i * 16 + 8}px`,
                                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                                    zIndex: 1,
                                    fontVariantNumeric: 'slashed-zero',
                                    color: `rgba(59, 130, 246, ${getOpacity(i, j)})`, // Blue color with dynamic opacity
                                    textShadow: getOpacity(i, j) > 0.2 ? `0 0 ${8 + getOpacity(i, j) * 12}px rgba(59, 130, 246, ${getOpacity(i, j) * 0.6})` : 'none',
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
