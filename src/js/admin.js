import { html, useState, useEffect, Icon, cn } from './globals.js';
import { getAllBookings, getContactRequests, exportBookingsToCSV, updateContactRequestStatus } from './database.js';
import { Button, Card } from './components/index.js';

export const AdminPanel = ({ lang, t }) => {
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);

  // Function to fetch and update local state
  const fetchData = async () => {
    setBookings(await getAllBookings());
    setRequests(await getContactRequests());
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, []);

  const downloadCSV = () => {
    const csv = exportBookingsToCSV(bookings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'bookings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler for the new "Mark as Processed" button
  const handleMarkAsProcessed = async (id) => {
    try {
      await updateContactRequestStatus(id, true);
      // Refresh the list from the DB to show the change
      await fetchData();
    } catch (err) {
      console.error("Failed to update request status:", err);
      alert("Error updating status. See console.");
    }
  };

  return html`
    <section id="admin" className="py-24 bg-muted/20 min-h-screen">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8">${t('Admin Panel', 'Panel de Administración')}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <${Card} className="overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-semibold mb-4">${t('Bookings', 'Reservas')} (${bookings.length})</h3>
              <${Button} onClick=${downloadCSV}>${t('Export Bookings CSV', 'Exportar Reservas CSV')}<//>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-medium">${t('Date', 'Fecha')}</th>
                    <th className="p-3 text-left font-medium">${t('Pet', 'Mascota')}</th>
                    <th className="p-3 text-left font-medium">${t('Service', 'Servicio')}</th>
                    <th className="p-3 text-left font-medium">${t('Owner', 'Dueño')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${bookings.length === 0 && html`
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-muted-foreground">${t('No bookings found.', 'No se encontraron reservas.')}</td>
                    </tr>
                  `}
                  ${bookings.map(b => html`
                    <tr key=${b.id} className="border-b">
                      <td className="p-3">${b.date} ${b.time}</td>
                      <td className="p-3">${b.petName}</td>
                      <td className="p-3">${t(b.service.en, b.service.es)}</td>
                      <td className="p-3">${b.ownerName} (${b.ownerPhone})</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          <//>
          
          <${Card} className="overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-semibold mb-4">${t('Contact Requests', 'Solicitudes de Contacto')} (${requests.length})</h3>
            </div>
              <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-medium">${t('Time', 'Hora')}</th>
                    <th className="p-3 text-left font-medium">${t('Phone', 'Teléfono')}</th>
                    <th className="p-3 text-left font-medium">${t('Reason', 'Razón')}</th>
                    <th className="p-3 text-left font-medium">${t('Status', 'Estado')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${requests.length === 0 && html`
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-muted-foreground">${t('No contact requests found.', 'No se encontraron solicitudes de contacto.')}</td>
                    </tr>
                  `}
                  ${requests.map(r => html`
                    <tr key=${r.id} className=${cn("border-b", r.processed && "bg-muted/50 text-muted-foreground line-through")}>
                      <td className="p-3">${r.preferred_time}</td>
                      <td className="p-3">${r.phone}</td>
                      <td className="p-3">${r.details}</td>
                      <td className="p-3">
                        ${r.processed
      ? html`<span className="font-medium">${t('Processed', 'Procesado')}</span>`
      : html`
                              <${Button} 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 text-xs"
                                onClick=${() => handleMarkAsProcessed(r.id)}
                              >
                                ${t('Mark Processed', 'Marcar Procesado')}
                              <//>
                            `
    }
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          <//>
        </div>
      </div>
    </section>
  `;
};