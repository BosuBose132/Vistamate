// /imports/ui/hooks/useOpenCV.js
import { useEffect, useState } from 'react';

export default function useOpenCV() {
    const [ready, setReady] = useState(Boolean(globalThis.__cvReady && globalThis.cv));

    useEffect(() => {
        if (ready) return;
        let t = 0;
        const id = setInterval(() => {
            if (globalThis.__cvReady && globalThis.cv) {
                clearInterval(id);
                setReady(true);
            } else if ((t += 100) > 10000) { // 10s timeout
                clearInterval(id);
                setReady(false);
            }
        }, 100);
        return () => clearInterval(id);
    }, [ready]);

    return { cv: globalThis.cv, ready };
}
