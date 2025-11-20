import { html, useContext, Icon } from '../../globals.js';
import { AppContext } from '../../AppContext.js';

export const Gallery = () => {
    const { t } = useContext(AppContext);

    const images = [
        { src: "assets/images/gallery1.jpg", alt: "Play Area" },
        { src: "assets/images/gallery2.jpg", alt: "Private Suite" },
        { src: "assets/images/gallery3.jpg", alt: "Grooming Station" },
        { src: "assets/images/gallery4.jpg", alt: "Outdoor Park" },
        { src: "assets/images/gallery5.jpg", alt: "Happy Dog" },
        { src: "assets/images/gallery6.jpg", alt: "Cozy Bed" }
    ];

    return html`
    <section id="gallery" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            ${t('Our Installations', 'Nuestras Instalaciones')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ${t('See where your pet will be staying and playing.', 'Vea dónde se alojará y jugará su mascota.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${images.map((img, idx) => html`
            <div 
              key=${idx} 
              className="relative h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
              style=${{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
                <${Icon} name="Image" className="w-12 h-12 opacity-20" />
              </div>
              <img 
                src=${img.src} 
                alt=${img.alt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                onError=${(e) => {
            e.target.style.display = 'none';
            e.target.previousSibling.style.display = 'flex';
        }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">${img.alt}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    </section>
  `;
};
