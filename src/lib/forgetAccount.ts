import { setCachedPlan } from './planCache';
import { clearOfflineAccess } from './usage';

/**
 * Everything this device keeps about a signed-in account, dropped when that account ends here (sign-out or
 * deletion). The offline token would otherwise keep paid tools working for up to 48 hours, and on a shared
 * computer would hand the last person's allowance to the next. The server-side session is ended separately.
 */
export function forgetAccountOnDevice(): void {
  clearOfflineAccess();
  setCachedPlan('anonymous');
  delete document.documentElement.dataset.plan;
}
