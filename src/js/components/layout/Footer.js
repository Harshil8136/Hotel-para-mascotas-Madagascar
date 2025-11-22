import { html } from '../../globals.js';

export const Footer = ({ t }) => {
    return html`
    <footer className="py-12 bg-muted">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>© ${new Date().getFullYear()} Hotel Madagascar. ${t('All rights reserved.', 'Todos los derechos reservados.')}</p>
      </div>
    </footer>
  `;
};
