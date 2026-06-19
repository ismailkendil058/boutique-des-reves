import React from 'react';

export function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'rgba(26,26,26,0.6)', ...style }}
    >
      {children}
    </th>
  );
}

export function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td className="py-4 px-4" style={style}>
      {children}
    </td>
  );
}

export function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: '#74367E' }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
