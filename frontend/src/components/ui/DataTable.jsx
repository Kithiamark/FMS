import React from 'react';
import { SkeletonTable } from './Skeleton';
import { EmptyState } from './EmptyState';
import { cn } from './Button';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no records to display.',
  onRowClick,
  renderMobileCard,
  className = '',
}) => {
  if (loading) {
    return <SkeletonTable rows={4} cols={columns.length || 3} className={className} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop & Tablet View (table) */}
      <div className="hidden md:block overflow-hidden rounded-card border border-surface-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-surface-border bg-surface-muted text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.key || idx}
                    scope="col"
                    className={cn('px-4 py-3.5', col.className)}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {data.map((row, rowIdx) => {
                const rowKey = row[keyField] ?? rowIdx;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'transition-colors hover:bg-slate-50/80',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.key || colIdx}
                        className={cn('px-4 py-3.5 align-middle', col.className)}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View (<md, >= 360px) */}
      <div className="md:hidden space-y-3">
        {data.map((row, rowIdx) => {
          const rowKey = row[keyField] ?? rowIdx;

          if (renderMobileCard) {
            return (
              <div
                key={rowKey}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(onRowClick && 'cursor-pointer active:scale-[0.99]')}
              >
                {renderMobileCard(row)}
              </div>
            );
          }

          return (
            <div
              key={rowKey}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                'rounded-card border border-surface-border bg-surface p-4 shadow-card transition-all',
                onRowClick && 'cursor-pointer active:scale-[0.99]'
              )}
            >
              <div className="space-y-2">
                {columns.map((col, colIdx) => {
                  const content = col.render ? col.render(row) : row[col.key];
                  if (colIdx === 0) {
                    return (
                      <div key={col.key || colIdx} className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {col.mobileLabel || col.header}
                        </span>
                        <div className="font-semibold text-slate-900">{content}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={col.key || colIdx} className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">{col.mobileLabel || col.header}</span>
                      <span className="font-medium text-slate-800 text-right">{content}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataTable;
