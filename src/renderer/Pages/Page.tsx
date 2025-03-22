import { ReactElement } from 'react';

export interface PageProps {
  children: ReactElement | ReactElement[];
}

export default function Page({ children }: PageProps) {
  return (
    <div
      style={{
        flexGrow: '1',
        height: '100%',
        padding: '5px',
        backgroundColor: '#272727',
        borderRadius: '7.5px 0px 0px 0px',
        // TODO: This should be a box shadow properly
        borderLeft: '1px solid #1d1d1d',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
}
