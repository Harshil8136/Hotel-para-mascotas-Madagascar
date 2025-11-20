import { html, useState, useContext, Icon } from '../../globals.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Switch } from '../ui/Switch.js';
import { AppContext } from '../../AppContext.js';
import { addBooking, addContactRequest } from '../../database.js';
import { getServiceById, ALL_SERVICES } from '../../chatbotLogic.js';

export const BookingWidget = ({ preselectedService, onClose }) => {
    const { lang, t } = useContext(AppContext);
    const [formData, setFormData] = useState({
        service: preselectedService?.id || "",
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        petName: "",
        petBreed: "",
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
        contactConsent: false,
        contactMethod: "email"
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [bookingId, setBookingId] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedService = getServiceById(formData.service);
        const bookingData = {
            ...formData,
            service: selectedService ? selectedService.name : { en: 'Unknown', es: 'Desconocido' },
            service_type: selectedService ? selectedService.type : 'unknown',
            status: "pending"
        };

        const savedBooking = await addBooking(bookingData);
        setBookingId(savedBooking.id);
        setIsSubmitted(true);

        if (formData.contactConsent) {
            await addContactRequest({
                bookingId: savedBooking.id,
                method: formData.contactMethod,
                details: `Booking ${savedBooking.id}`,
                preferred_time: 'ASAP'
            });
        }
    };

    if (isSubmitted) {
        return html`
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t-4 border-primary shadow-lg z-40 p-4 animate-slide-up-fade">
        <div className="container mx-auto max-w-2xl text-center p-8">
          <${Icon} name="Check" className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 p-4 animate-scale-in" />
          <h3 className="text-2xl font-bold text-foreground mb-2">${t('Booking Confirmed!', '¡Reserva Confirmada!')}</h3>
          <p className="text-muted-foreground mb-4">${t('Your booking ID is:', 'Su ID de reserva es:')}</p>
          <p className="text-2xl font-bold text-primary mb-6">${bookingId.toString().slice(-8)}</p>
          <${Button} onClick=${onClose}>${t('Done', 'Hecho')}<//>
        </div>
      </div>
    `;
    }

    return html`
    <div className="fixed inset-0 bg-black/80 z-40 animate-fade-in" onClick=${onClose}></div>
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border shadow-lg z-50 transition-all duration-300 animate-slide-up-fade">
      <div className="container mx-auto px-4 py-6 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">${t('Book Your Appointment', 'Reserve su Cita')}</h2>
          <${Button} 
            variant="ghost" 
            size="icon"
            onClick=${onClose}
          >
            <${Icon} name="X" className="w-5 h-5" />
          <//>
        </div>

        <form onSubmit=${handleSubmit} className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <label htmlFor="service" className="text-sm font-medium">${t('Service', 'Servicio')} *</label>
            <${Select} id="service" name="service" value=${formData.service} onChange=${handleChange} required>
              <option value="" disabled>${t('Select a service', 'Seleccione un servicio')}</option>
              ${ALL_SERVICES.map(s => html`
                <option key=${s.id} value=${s.id}>
                  ${t(s.name.en, s.name.es)} - ${s.price}
                </option>
              `)}
            <//>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">${t('Date', 'Fecha')} *</label>
            <${Input} id="date" name="date" type="date" value=${formData.date} onChange=${handleChange} min=${new Date().toISOString().split('T')[0]} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="time" className="text-sm font-medium">${t('Time', 'Hora')} *</label>
            <${Input} id="time" name="time" type="time" value=${formData.time} onChange=${handleChange} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="petName" className="text-sm font-medium">${t("Pet's Name", 'Nombre de Mascota')} *</label>
            <${Input} id="petName" name="petName" value=${formData.petName} onChange=${handleChange} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="petBreed" className="text-sm font-medium">${t('Pet Breed', 'Raza de Mascota')} *</label>
            <${Input} id="petBreed" name="petBreed" value=${formData.petBreed} onChange=${handleChange} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="ownerName" className="text-sm font-medium">${t('Your Name', 'Su Nombre')} *</label>
            <${Input} id="ownerName" name="ownerName" value=${formData.ownerName} onChange=${handleChange} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="ownerEmail" className="text-sm font-medium">${t('Your Email', 'Su Email')} *</label>
            <${Input} id="ownerEmail" name="ownerEmail" type="email" value=${formData.ownerEmail} onChange=${handleChange} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="ownerPhone" className="text-sm font-medium">${t('Your Phone', 'Su Teléfono')} *</label>
            <${Input} id="ownerPhone" name="ownerPhone" type="tel" value=${formData.ownerPhone} onChange=${handleChange} required />
          </div>

          <div className="md:col-span-2 space-y-4 p-4 bg-accent/20 rounded-lg border-2 border-accent">
            <div className="flex items-center justify-between">
              <label htmlFor="contactConsent" className="cursor-pointer text-sm font-medium">
                ${t('Would you like a staff member to contact you?', '¿Desea que un miembro del personal lo contacte?')}
              </label>
              <${Switch} id="contactConsent" name="contactConsent" checked=${formData.contactConsent} onCheckedChange=${(checked) => handleChange({ target: { name: 'contactConsent', type: 'checkbox', checked } })} />
            </div>

            ${formData.contactConsent && html`
              <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium">${t('Preferred Method', 'Método Preferido')}</label>
                  <${Select} name="contactMethod" value=${formData.contactMethod} onChange=${handleChange}>
                    <option value="email">${t('Email', 'Correo Electrónico')}</option>
                    <option value="phone">${t('Phone Call', 'Llamada Telefónica')}</option>
                    <option value="text">${t('Text Message', 'Mensaje de Texto')}</option>
                  <//>
                </div>
              </div>
            `}
          </div>

          <div className="md:col-span-2">
            <${Button} type="submit" size="lg" className="w-full">
              <${Icon} name="Calendar" className="mr-2 w-5 h-5" />
              ${t('Confirm Booking', 'Confirmar Reserva')}
            <//>
          </div>
        </form>
      </div>
    </div>
  `;
};
