/**
 * Purok Colors
 * Color scheme for purok territory visualization
 */

export const PUROK_COLORS = {
    // Default territory style
    default: {
        fill: 'rgba(59, 130, 246, 0.25)',  // Blue with low opacity
        stroke: '#3B82F6',                   // Solid blue border
        strokeWidth: 2,
    },
    // Selected/tapped territory
    selected: {
        fill: 'rgba(34, 197, 94, 0.5)',     // Green with higher opacity
        stroke: '#22c55e',                   // Bright green border
        strokeWidth: 3,
    },
    // Special territories (like boundary)
    boundary: {
        fill: 'rgba(107, 114, 128, 0.1)',   // Very light gray
        stroke: '#6b7280',                   // Gray border
        strokeWidth: 2,
    },
};
