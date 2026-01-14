'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { TrustCenterSettings } from '@/types';

interface BrandingProviderProps {
    children: React.ReactNode;
}

export default function BrandingProvider({ children }: BrandingProviderProps) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function loadBranding() {
            try {
                const settings = await apiRequest<TrustCenterSettings>('/api/settings');

                // Set CSS custom properties on the root element
                const root = document.documentElement;

                if (settings.primary_color) {
                    root.style.setProperty('--brand-primary', settings.primary_color);
                }
                if (settings.secondary_color) {
                    root.style.setProperty('--brand-secondary', settings.secondary_color);
                }
                if (settings.font_family) {
                    root.style.setProperty('--brand-font', settings.font_family);
                    // Also set the font-family directly on the body
                    document.body.style.fontFamily = `${settings.font_family}, system-ui, sans-serif`;
                }

                // Set additional computed colors for hover states etc.
                if (settings.primary_color) {
                    // Create a slightly lighter version for hover
                    root.style.setProperty('--brand-primary-light', adjustBrightness(settings.primary_color, 20));
                    root.style.setProperty('--brand-primary-dark', adjustBrightness(settings.primary_color, -20));
                }
                if (settings.secondary_color) {
                    root.style.setProperty('--brand-secondary-light', adjustBrightness(settings.secondary_color, 20));
                    root.style.setProperty('--brand-secondary-dark', adjustBrightness(settings.secondary_color, -20));
                }
            } catch (error) {
                console.error('Failed to load branding settings:', error);
            } finally {
                setLoaded(true);
            }
        }

        loadBranding();
    }, []);

    return <>{children}</>;
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Adjust
    r = Math.min(255, Math.max(0, r + (percent * 2.55)));
    g = Math.min(255, Math.max(0, g + (percent * 2.55)));
    b = Math.min(255, Math.max(0, b + (percent * 2.55)));

    // Convert back to hex
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}
