import { html, useContext, Icon } from '../../globals.js';
import { AppContext } from '../../AppContext.js';

export const Requirements = () => {
    const { t } = useContext(AppContext);

    const reqs = [
        {
            icon: "FileText",
            title: { en: "Vaccination Record", es: "Cartilla de Vacunación" },
            desc: { en: "Must be up to date (Rabies, DHPP, Bordetella).", es: "Debe estar al día (Rabia, DHPP, Bordetella)." }
        },
        {
            icon: "ShieldCheck",
            title: { en: "Flea & Tick Prevention", es: "Prevención de Pulgas y Garrapatas" },
            desc: { en: "Must be on a current prevention program.", es: "Debe estar en un programa de prevención actual." }
        },
        {
            icon: "Utensils",
            title: { en: "Food", es: "Alimento" },
            desc: { en: "Please bring enough food for the stay + 2 extra days.", es: "Por favor traiga suficiente comida para la estancia + 2 días extra." }
        },
        {
            icon: "Dog",
            title: { en: "Collar & Leash", es: "Collar y Correa" },
            desc: { en: "Required for safe check-in and check-out.", es: "Requerido para un ingreso y salida seguros." }
        }
    ];

    return html`
    <section id="requirements" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            ${t('Requirements', 'Requisitos')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ${t('To ensure the safety and health of all our guests.', 'Para garantizar la seguridad y salud de todos nuestros huéspedes.')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          ${reqs.map((req, idx) => html`
            <div 
              key=${idx} 
              className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all text-center group"
              style=${{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <${Icon} name=${req.icon} className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">${t(req.title.en, req.title.es)}</h3>
              <p className="text-sm text-muted-foreground">${t(req.desc.en, req.desc.es)}</p>
            </div>
          `)}
        </div>
      </div>
    </section>
  `;
};
