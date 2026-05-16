/* eslint-disable-next-line no-unused-vars, unused-imports/no-unused-imports */
import React from 'react';
// imports/ui/components/StatCard.jsx

export default function StatCard({ title, value }) {
    return (
        <div className="card bg-base-100 shadow p-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-2xl">{value}</p>
        </div>
    );
}

