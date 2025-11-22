import { html, cn } from '../../globals.js';

export const Textarea = ({ className, ...props }) => {
    return html`
    <textarea
      className=${cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
    )}
      ...${props}
    />
  `;
};
