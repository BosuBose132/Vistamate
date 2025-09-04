import { useReducedMotion } from "framer-motion";

export const fade = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.35, ease: "easeOut", delay } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
});

export const slideUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay } },
    exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
});

export const slideInRight = (delay = 0) => ({
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut", delay } },
    exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
});

export const scaleIn = (delay = 0) => ({
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut", delay } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
});

// Helper: if reduced motion, return no-ops
export const maybe = (variant) => {
    const prefers = useReducedMotion();
    if (prefers) {
        return { initial: {}, animate: {}, exit: {} };
    }
    return variant;
};
