import AdminSecurityGate from './security-gate';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSecurityGate>{children}</AdminSecurityGate>;
}
