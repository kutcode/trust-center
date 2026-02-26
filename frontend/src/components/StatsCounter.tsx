'use client';

import { useState, useEffect, useRef } from 'react';

interface StatItem {
    value: number | string;
    label: string;
    icon: React.ReactNode;
    suffix?: string;
    prefix?: string;
}

interface StatsCounterProps {
    stats: StatItem[];
}

function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number | string; suffix?: string; prefix?: string }) {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (typeof value !== 'number') return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    const duration = 1500;
                    const steps = 60;
                    const increment = value / steps;
                    let current = 0;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= value) {
                            setDisplayValue(value);
                            clearInterval(timer);
                        } else {
                            setDisplayValue(Math.floor(current));
                        }
                    }, duration / steps);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [value, hasAnimated]);

    if (typeof value === 'string') {
        return <span ref={ref}>{prefix}{value}{suffix}</span>;
    }

    return <span ref={ref}>{prefix}{displayValue}{suffix}</span>;
}

export default function StatsCounter({ stats }: StatsCounterProps) {
    return (
        <section className="relative z-10 py-8">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={`text-center animate-fade-in-up animate-delay-${(index + 1) * 100} group`}
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                                    {stat.icon}
                                </div>
                                <div className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
                                    <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                                </div>
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
