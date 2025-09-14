// imports/ui/components/StatCard.jsx
import React from 'react';

export default function StatCard({ title, value }) {
    return (
        <div className="card bg-base-100 shadow p-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-2xl">{value}</p>
        </div>
    );
}

