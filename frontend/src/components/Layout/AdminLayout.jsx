import React from 'react';
import { AppShell } from './AppShell';

export const AdminLayout = ({ children }) => {
  return <AppShell roleOverride="ADMIN">{children}</AppShell>;
};

export default AdminLayout;
