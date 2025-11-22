import { html, cn } from '../../globals.js';

export const Card = ({ className, children, ...props }) => {
    return html`
    <div
      className=${cn(
        "rounded-xl border bg-card text-card-foreground shadow-md transition-all duration-smooth",
        className
    )}
      ...${props}
    >
      ${children}
    </div>
  `;
};
