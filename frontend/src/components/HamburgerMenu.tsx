import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Calculator, History, Info } from 'lucide-react';

export function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const menuItems = [
        { icon: Calculator, label: 'Calculator' },
        { icon: History, label: 'History' },
        { icon: Info, label: 'About' },
    ];

    return (
        <div ref={menuRef} className="relative">
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 focus:outline-none"
                style={{
                    background: isOpen
                        ? 'oklch(0.85 0.22 142 / 0.15)'
                        : 'oklch(0.2 0 0)',
                    border: `1px solid ${isOpen ? 'oklch(0.85 0.22 142 / 0.5)' : 'oklch(0.28 0 0)'}`,
                    color: isOpen ? 'oklch(0.85 0.22 142)' : 'oklch(0.65 0 0)',
                    boxShadow: isOpen ? '0 0 10px oklch(0.85 0.22 142 / 0.25)' : 'none',
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.background = 'oklch(0.85 0.22 142 / 0.1)';
                        e.currentTarget.style.borderColor = 'oklch(0.85 0.22 142 / 0.35)';
                        e.currentTarget.style.color = 'oklch(0.85 0.22 142)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.background = 'oklch(0.2 0 0)';
                        e.currentTarget.style.borderColor = 'oklch(0.28 0 0)';
                        e.currentTarget.style.color = 'oklch(0.65 0 0)';
                    }
                }}
            >
                {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Slide-in Dropdown Panel */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
                    style={{
                        background: 'oklch(0.17 0 0)',
                        border: '1px solid oklch(0.25 0 0)',
                        boxShadow: '0 8px 32px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0.85 0.22 142 / 0.08)',
                        animation: 'slideDown 0.15s ease-out',
                    }}
                >
                    {/* Panel Header */}
                    <div
                        className="px-4 py-2.5 text-xs font-mono tracking-widest uppercase"
                        style={{
                            color: 'oklch(0.85 0.22 142)',
                            borderBottom: '1px solid oklch(0.22 0 0)',
                            background: 'oklch(0.85 0.22 142 / 0.05)',
                        }}
                    >
                        Menu
                    </div>

                    {/* Menu Items */}
                    <ul className="py-1">
                        {menuItems.map(({ icon: Icon, label }) => (
                            <li key={label}>
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-all duration-100 text-left"
                                    style={{ color: 'oklch(0.7 0 0)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'oklch(0.85 0.22 142 / 0.08)';
                                        e.currentTarget.style.color = 'oklch(0.85 0.22 142)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'oklch(0.7 0 0)';
                                    }}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
