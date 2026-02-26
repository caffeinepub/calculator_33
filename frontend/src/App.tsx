import React from 'react';
import { Calculator } from './components/Calculator';
import { HamburgerMenu } from './components/HamburgerMenu';
import { Heart } from 'lucide-react';

export default function App() {
    const appId = encodeURIComponent(
        typeof window !== 'undefined' ? window.location.hostname : 'calculator-app'
    );

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: 'oklch(0.13 0 0)' }}
        >
            {/* Header */}
            <header
                className="w-full px-6 py-4 flex items-center justify-between shrink-0"
                style={{
                    borderBottom: '1px solid oklch(0.2 0 0)',
                    background: 'oklch(0.15 0 0)',
                }}
            >
                {/* Left: Brand */}
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm"
                        style={{
                            background: 'oklch(0.85 0.22 142 / 0.15)',
                            color: 'oklch(0.85 0.22 142)',
                            border: '1px solid oklch(0.85 0.22 142 / 0.3)',
                            boxShadow: '0 0 10px oklch(0.85 0.22 142 / 0.2)',
                        }}
                    >
                        ∑
                    </div>
                    <div>
                        <h1
                            className="text-base font-semibold tracking-wide"
                            style={{ color: 'oklch(0.9 0 0)' }}
                        >
                            Calculator
                        </h1>
                        <p className="text-xs" style={{ color: 'oklch(0.45 0 0)' }}>
                            Basic arithmetic
                        </p>
                    </div>
                </div>

                {/* Right: On-chain indicator + Hamburger */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{
                                background: 'oklch(0.85 0.22 142)',
                                boxShadow: '0 0 6px oklch(0.85 0.22 142)',
                            }}
                        />
                        <span className="text-xs font-mono" style={{ color: 'oklch(0.45 0 0)' }}>
                            ON CHAIN
                        </span>
                    </div>

                    {/* Hamburger Menu */}
                    <HamburgerMenu />
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
                <Calculator />
            </main>

            {/* Footer */}
            <footer
                className="w-full px-6 py-4 text-center shrink-0"
                style={{
                    borderTop: '1px solid oklch(0.2 0 0)',
                    background: 'oklch(0.15 0 0)',
                }}
            >
                <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: 'oklch(0.38 0 0)' }}>
                    <span>© {new Date().getFullYear()} Built with</span>
                    <Heart
                        className="w-3 h-3 inline-block"
                        style={{ color: 'oklch(0.65 0.22 25)', fill: 'oklch(0.65 0.22 25)' }}
                    />
                    <span>using</span>
                    <a
                        href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors"
                        style={{ color: 'oklch(0.85 0.22 142)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'oklch(0.92 0.18 142)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'oklch(0.85 0.22 142)')}
                    >
                        caffeine.ai
                    </a>
                </p>
            </footer>
        </div>
    );
}
