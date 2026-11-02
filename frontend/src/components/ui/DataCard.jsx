import React from 'react';
import { StatCard } from './StatCard';

/**
 * DataCard is backward-compatible with legacy usages, forwarding directly to the upgraded StatCard.
 */
export const DataCard = (props) => {
  return <StatCard {...props} />;
};

export default DataCard;
