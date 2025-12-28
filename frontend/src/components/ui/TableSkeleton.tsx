'use client';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-12 bg-gray-100 border-b border-gray-200" />
            <div className="divide-y divide-gray-200">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center px-6 py-4 space-x-4">
                        {Array.from({ length: columns }).map((_, j) => (
                            <div
                                key={j}
                                className="h-4 bg-gray-200 rounded"
                                style={{ width: `${Math.max(30, Math.floor(Math.random() * 80))}%` }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
