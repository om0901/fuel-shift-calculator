import { FC, ReactNode } from 'react';
import { Header } from './Header';
import { Container } from './Container';

export interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-50 selection:bg-blue-600 selection:text-white">
      <Header />
      <Container>{children}</Container>
    </div>
  );
};
