import { FC, ReactNode } from 'react';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container: FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <main className={`max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 ${className}`}>
      {children}
    </main>
  );
};
