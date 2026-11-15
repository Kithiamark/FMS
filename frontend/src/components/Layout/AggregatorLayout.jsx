import React from 'react';
import { AppShell } from './AppShell';

export const AggregatorLayout = ({ children }) => {
  return <AppShell roleOverride="AGGREGATOR">{children}</AppShell>;
};

export default AggregatorLayout;
