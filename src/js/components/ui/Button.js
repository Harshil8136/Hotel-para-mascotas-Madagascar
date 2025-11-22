import { html, cn } from '../../globals.js';

export const Button = ({ className, children, ...props }) => {
    const variant = props.variant;
    const size = props.size;

    // Remove variant and size from props so they don't end up on the DOM element
    delete props.variant;
    delete props.size;

    return html`
    <button
      className=${cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
        "h-11 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-md hover:shadow-lg", // Default
        variant === 'ghost' && 'bg-transparent shadow-none hover:bg-accent text-primary',
        variant === 'glass' && 'bg-card/50 backdrop-blur-md text-card-foreground border border-border/50 hover:bg-card/70 hover:border-border shadow-lg hover:shadow-xl',
        variant === 'outline' && 'border-2 border-border bg-transparent hover:bg-accent shadow-sm text-primary',
        size === 'xl' && 'h-16 rounded-2xl px-12 text-lg',
        size === 'icon' && 'h-11 w-11 px-0', // Fix icon padding
        className
    )}
      ...${props}
    >
      ${children}
    </button>
  `;
};
