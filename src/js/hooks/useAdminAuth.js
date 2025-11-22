import { useState } from '../globals.js';
import { adminLoginLimiter } from '../security/rateLimit.js';

export const useAdminAuth = (t) => {
    const [isAdmin, setIsAdmin] = useState(false);

    const checkAdmin = () => {
        if (window.location.hash === '#admin') {
            // SECURITY: Check rate limit before allowing admin login attempt
            const rateLimitStatus = adminLoginLimiter.getStatus();

            if (rateLimitStatus.isLocked) {
                alert(t(
                    `Too many failed login attempts. Please wait ${rateLimitStatus.retryAfter} seconds before trying again.`,
                    `Demasiados intentos fallidos. Por favor espere ${rateLimitStatus.retryAfter} segundos antes de intentar nuevamente.`
                ));
                window.location.hash = '';
                return false;
            }

            // SECURITY WARNING: This is a demo-only auth mechanism
            const md5 = (s) => {
                let h = 0;
                for (let i = 0; i < s.length; i++) {
                    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
                }
                let res = h.toString(16);
                if (res.startsWith('-')) {
                    res = res.substring(1);
                }
                return res.padStart(8, '0');
            };

            const pass = prompt(t('Enter admin password', 'Ingrese la contraseña de administrador'));

            if (!pass) {
                window.location.hash = '';
                return false;
            }

            const ADMIN_HASH = '015a27e0'; // Hash for "adminpass"

            if (md5(pass) === ADMIN_HASH) {
                setIsAdmin(true);
                adminLoginLimiter.reset(); // Reset rate limit on successful login
                return true;
            } else {
                adminLoginLimiter.recordAttempt(); // Record failed attempt
                const status = adminLoginLimiter.getStatus();
                const remaining = status.maxAttempts - status.attempts;

                alert(t(
                    `Incorrect password. ${remaining} attempts remaining.`,
                    `Contraseña incorrecta. ${remaining} intentos restantes.`
                ));
                window.location.hash = '';
                return false;
            }
        }
        return false;
    };

    return { isAdmin, checkAdmin };
};
