declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        trigger?: string;
        delay?: string | number;
        colors?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

// Se necesita esta línea vacía para que el archivo sea tratado como un módulo.
export {};