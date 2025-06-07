declare module 'react-copy-to-clipboard' {
  import * as React from 'react';
  export interface CopyToClipboardProps {
    text: string;
    onCopy?: (text: string, result: boolean) => void;
    options?: {
      debug?: boolean;
      message?: string;
      format?: string;
    };
    children?: React.ReactNode;
  }
  export class CopyToClipboard extends React.Component<CopyToClipboardProps> {}
  export default CopyToClipboard;
} 
 
 
 
 
 