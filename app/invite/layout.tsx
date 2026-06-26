import type { ReactNode } from "react";
import "@/src/App.css";

export default function InviteLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
