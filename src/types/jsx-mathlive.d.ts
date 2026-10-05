import type React from 'react';

declare global {
  interface MathfieldElement extends HTMLElement {
    value: string;
    readOnly: boolean;
    placeholder?: string;
  }

  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement>,
        MathfieldElement
      > & {
        readOnly?: boolean;
        placeholder?: string;
      };
    }
  }
}

export {};


// React 19 đọc JSX.IntrinsicElements từ module 'react' (không còn từ JSX toàn cục)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        readOnly?: boolean;
        placeholder?: string;
      };
    }
  }
}
