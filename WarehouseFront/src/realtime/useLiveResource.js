// ============ useLiveResource ============
// Hook gjenerik: abonohet te një ose më shumë resurse dhe thërret reload()
// kur backend-i dërgon "ResourceChanged" për ndonjërin.
//
//   useLiveResource('products', load);
//   useLiveResource(['salesorders', 'products'], load);
//
// - Debounce ~300ms: një mutim që prek disa resurse (p.sh. marrja e një PO →
//   purchaseorders+inventory+products) shkakton VETËM një rifreskim.
// - Refetch në 'focus': rrjetë sigurie për eventet e humbura gjatë shkëputjes.

import { useEffect, useRef } from 'react';
import { useRealtime } from './RealtimeContext';

const DEBOUNCE_MS = 300;

export function useLiveResource(resources, reload) {
  const { subscribe } = useRealtime();

  // Mbajmë reload-in e fundit në ref që ndryshimi i identitetit të tij (çdo
  // render) të mos riabonojë / të mos rilidhë listener-at. E përditësojmë në
  // efekt (jo gjatë render-it) që callback-et ta lexojnë gjithmonë të fundit.
  const reloadRef = useRef(reload);
  useEffect(() => { reloadRef.current = reload; });

  // Çelës i qëndrueshëm nga lista e resurseve për dependency-në e efektit.
  const key = Array.isArray(resources) ? resources.join(',') : resources;

  useEffect(() => {
    const list = Array.isArray(resources) ? resources : [resources];
    let timer = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => reloadRef.current?.(), DEBOUNCE_MS);
    };

    const unsubs = list.map(r => subscribe(r, trigger));

    const onFocus = () => reloadRef.current?.();
    window.addEventListener('focus', onFocus);

    return () => {
      unsubs.forEach(u => u());
      window.removeEventListener('focus', onFocus);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, subscribe]);
}
