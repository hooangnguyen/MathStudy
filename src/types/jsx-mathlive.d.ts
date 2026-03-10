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

