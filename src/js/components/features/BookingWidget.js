import { html, useState, useContext, useRef, useEffect, Icon } from '../../globals.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Switch } from '../ui/Switch.js';
import { AppContext } from '../../AppContext.js';
import { addBooking, addContactRequest } from '../../database.js';
import { getServiceById, ALL_SERVICES } from '../../chatbotLogic.js';
// SECURITY: Import validation utilities
import { validateBookingForm, sanitizeText, isValidEmail, isValidPhone } from '../../security/sanitizer.js';
import { bookingLimiter, checkRateLimit } from '../../security/rateLimit.js';

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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  // Mobile UX: Auto-focus first input when widget opens
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (firstInputRef.current && window.innerWidth > 640) {
        // Only autofocus on larger screens to avoid mobile keyboard popping up
        firstInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    // SECURITY: Check rate limit
    const rateLimitCheck = checkRateLimit(bookingLimiter, t('booking', 'reserva'));
    if (!rateLimitCheck.allowed) {
      alert(rateLimitCheck.message);
      return;
    }

    // SECURITY: Validate and sanitize all inputs
    const validation = validateBookingForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Focus first error field
      const firstErrorField = Object.keys(validation.errors)[0];
      const errorElement = document.getElementsByName(firstErrorField)[0];
      if (errorElement) {
        errorElement.focus();
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedService = getServiceById(formData.service);

      // SECURITY: Sanitize text inputs before storing
      const sanitizedData = {
        service: selectedService ? selectedService.name : { en: 'Unknown', es: 'Desconocido' },
        service_type: selectedService ? selectedService.type : 'unknown',
        date: formData.date,
        time: formData.time,
        petName: sanitizeText(formData.petName, 100),
        petBreed: sanitizeText(formData.petBreed, 100),
        ownerName: sanitizeText(formData.ownerName, 100),
        ownerEmail: formData.ownerEmail.toLowerCase().trim(),
        ownerPhone: sanitizeText(formData.ownerPhone, 20),
        contactConsent: formData.contactConsent,
        contactMethod: formData.contactMethod,
        status: "pending"
      };

      const savedBooking = await addBooking(sanitizedData);
      setBookingId(savedBooking.id);
      setIsSubmitted(true);

      if (formData.contactConsent) {
        await addContactRequest({
          bookingId: savedBooking.id,
          phone: sanitizedData.ownerPhone,
          method: formData.contactMethod,
          details: `${t('Booking', 'Reserva')} ${savedBooking.id}`,
          preferred_time: 'ASAP'
        });
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert(t(
        'An error occurred while submitting your booking. Please try again.',
        'Ocurrió un error al enviar su reserva. Por favor intente nuevamente.'
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return html`
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t-4 border-primary shadow-lg z-40 p-4 animate-slide-up-fade sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-xl">
        <div className="text-center p-4 sm:p-8">
          <${Icon} name="Check" className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 p-4 animate-scale-in" />
          <h3 className="text-2xl font-bold text-foreground mb-2">${t('Booking Confirmed!', '¡Reserva Confirmada!')}</h3>
          <p className="text-muted-foreground mb-4">${t('Your booking ID is:', 'Su ID de reserva es:')}</p>
          <p className="text-2xl font-bold text-primary mb-6">${bookingId.toString().slice(-8)}</p>
          <${Button} onClick=${onClose} size="lg" className="min-h-[44px]">${t('Done', 'Hecho')}<//>
        </div>
      </div>
    `;
  }

  return html`
    <div className="fixed inset-0 bg-black/80 z-40 animate-fade-in" onClick=${onClose}></div>
    <div className="fixed inset-0 sm:bottom-0 sm:inset-auto left-0 right-0 bg-card border-t-2 sm:border-t-0 sm:border-2 border-border shadow-lg z-50 transition-all duration-300 animate-slide-up-fade sm:max-h-[90vh] overflow-auto">
      <div className="container mx-auto px-4 py-6 max-h-[100vh] sm:max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pb-4 border-b border-border sm:static sm:border-0 sm:pb-0">
          <h2 className="text-2xl font-bold text-foreground">${t('Book Your Appointment', 'Reserve su Cita')}</h2>
          <${Button} 
            variant="ghost" 
            size="icon"
            onClick=${onClose}
            className="min-h-[44px] min-w-[44px]"
          >
            <${Icon} name="X" className="w-5 h-5" />
          <//>
        </div>

        <form onSubmit=${handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto pb-20 sm:pb-4">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="service" className="text-sm font-medium block">${t('Service', 'Servicio')} *</label>
            <${Select} 
              id="service" 
              name="service" 
              value=${formData.service} 
              onChange=${handleChange} 
              required
              ref=${firstInputRef}
              className=${errors.service ? 'border-destructive' : ''}
            >
              <option value="" disabled>${t('Select a service', 'Seleccione un servicio')}</option>
              ${ALL_SERVICES.map(s => html`
                <option key=${s.id} value=${s.id}>
                  ${t(s.name.en, s.name.es)} - ${s.price}
                </option>
              `)}
            <//>
            ${errors.service && html`<p className="text-sm text-destructive">${errors.service}</p>`}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium block">${t('Date', 'Fecha')} *</label>
            <${Input} 
              id="date" 
              name="date" 
              type="date" 
              value=${formData.date} 
              onChange=${handleChange} 
              min=${new Date().toISOString().split('T')[0]} 
              required
              className=${errors.date ? 'border-destructive' : ''}
            />
            ${errors.date && html`<p className="text-sm text-destructive">${errors.date}</p>`}
          </div>

          <div className="space-y-2">
            <label htmlFor="time" className="text-sm font-medium block">${t('Time', 'Hora')} *</label>
            <${Input} 
              id="time" 
              name="time" 
              type="time" 
              value=${formData.time} 
              onChange=${handleChange} 
              required
              className=${errors.time ? 'border-destructive' : ''}
            />
            ${errors.time && html`<p className="text-sm text-destructive">${errors.time}</p>`}
          </div>

          <div className="space-y-2">
            <label htmlFor="petName" className="text-sm font-medium block">${t("Pet's Name", 'Nombre de Mascota')} *</label>
            <${Input} 
              id="petName" 
              name="petName" 
              value=${formData.petName} 
              onChange=${handleChange} 
              required
              autocomplete="off"
              autocapitalize="words"
              maxlength="100"
              className=${errors.petName ? 'border-destructive' : ''}
            />
            ${errors.petName && html`<p className="text-sm text-destructive">${errors.petName}</p>`}
          </div>

          <div className="space-y-2">
            <label htmlFor="petBreed" className="text-sm font-medium block">${t('Pet Breed', 'Raza de Mascota')} *</label>
            <${Input} 
              id="petBreed" 
              name="petBreed" 
              value=${formData.petBreed} 
              onChange=${handleChange} 
              required
              autocomplete="off"
              autocapitalize="words"
              maxlength="100"
              className=${errors.petBreed ? 'border-destructive' : ''}
            />
            ${errors.petBreed && html`<p className="text-sm text-destructive">${errors.petBreed}</p>`}
          </div>

          <div className="space-y-2">
            <label htmlFor="ownerName" className="text-sm font-medium block">${t('Your Name', 'Su Nombre')} *</label>
            <${Input} 
              id="ownerName" 
              name="ownerName" 
              value=${formData.ownerName} 
              onChange=${handleChange} 
              required
              autocomplete="name"
              autocapitalize="words"
              maxlength="100"
              className=${errors.ownerName ? 'border-destructive' : ''}
            />
            ${errors.ownerName && html`<p className="text-sm text-destructive">${errors.ownerName}</p>`}
          </div>

          <div className="space-y-2">
            <label htmlFor="ownerEmail" className="text-sm font-medium block">${t('Your Email', 'Su Email')} *</label>
            <${Input} 
              id="ownerEmail" 
              name="ownerEmail" 
              type="email" 
              value=${formData.ownerEmail} 
              onChange=${handleChange} 
              required
              autocomplete="email"
              inputmode="email"
              maxlength="254"
              className=${errors.ownerEmail ? 'border-destructive' : ''}
            />
            ${errors.ownerEmail && html`<p className="text-sm text-destructive">${errors.ownerEmail}</p>`}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="ownerPhone" className="text-sm font-medium block">${t('Your Phone', 'Su Teléfono')} *</label>
            <${Input} 
              id="ownerPhone" 
              name="ownerPhone" 
              type="tel" 
              value=${formData.ownerPhone} 
              onChange=${handleChange} 
              required
              autocomplete="tel"
              inputmode="tel"
              placeholder="+52 XXX XXX XXXX"
              maxlength="20"
              className=${errors.ownerPhone ? 'border-destructive' : ''}
            />
            ${errors.ownerPhone && html`<p className="text-sm text-destructive">${errors.ownerPhone}</p>`}
          </div>

          <div className="sm:col-span-2 space-y-4 p-4 bg-accent/20 rounded-lg border-2 border-accent">
            <div className="flex items-center justify-between">
              <label htmlFor="contactConsent" className="cursor-pointer text-sm font-medium flex-1 mr-2">
                ${t('Would you like a staff member to contact you?', '¿Desea que un miembro del personal lo contacte?')}
              </label>
              <${Switch} id="contactConsent" name="contactConsent" checked=${formData.contactConsent} onCheckedChange=${(checked) => handleChange({ target: { name: 'contactConsent', type: 'checkbox', checked } })} />
            </div>

            ${formData.contactConsent && html`
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium block">${t('Preferred Method', 'Método Preferido')}</label>
                <${Select} name="contactMethod" value=${formData.contactMethod} onChange=${handleChange}>
                  <option value="email">${t('Email', 'Correo Electrónico')}</option>
                  <option value="phone">${t('Phone Call', 'Llamada Telefónica')}</option>
                  <option value="text">${t('Text Message', 'Mensaje de Texto')}</option>
                <//>
              </div>
            `}
          </div>

          <div className="sm:col-span-2 sticky bottom-0 bg-card pt-4 border-t border-border mt-4 sm:static sm:border-0 sm:mt-0">
            <${Button} 
              type="submit" 
              size="lg" 
              className="w-full min-h-[48px] text-base"
              disabled=${isSubmitting}
            >
              <${Icon} name="Calendar" className="mr-2 w-5 h-5" />
              ${isSubmitting
      ? t('Submitting...', 'Enviando...')
      : t('Confirm Booking', 'Confirmar Reserva')}
            <//>
          </div>
        </form>
      </div>
    </div>
  `;
};
