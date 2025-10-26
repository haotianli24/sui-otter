import { useCallback, useEffect, useRef } from 'react';
import { jwtToAddress } from '@mysten/sui/zklogin';
import { useAuth } from '@/providers/AuthProvider';

const DEMO_USER_SALT = '12345678901234567890';

export default function GoogleLoginButton() {
  const { setAddress } = useAuth();
  const initialized = useRef(false);
  const rendered = useRef(false);
  const btnRef = useRef<HTMLDivElement | null>(null);

  const callback = useCallback((response: any) => {
    try {
      const jwt: string | undefined = response?.credential;
      if (!jwt) return;
      const addr = jwtToAddress(jwt, DEMO_USER_SALT);
      setAddress(addr);
      window.dispatchEvent(new CustomEvent('zklogin:login', { detail: { address: addr } }));
    } catch (e) {
      console.error('zkLogin derive failed', e);
    }
  }, [setAddress]);

  const init = useCallback(() => {
    const google: any = (window as any).google;
    if (!google?.accounts?.id) return; // wait for script
    if (!initialized.current) {
      const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || (window as any).VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn('Missing VITE_GOOGLE_CLIENT_ID');
        return;
      }
      google.accounts.id.initialize({ client_id: clientId, callback, ux_mode: 'popup', auto_select: false });
      initialized.current = true;
    }
    if (btnRef.current && !rendered.current) {
      try {
        google.accounts.id.renderButton(btnRef.current, { theme: 'outline', size: 'medium', type: 'standard', shape: 'rectangular' });
        rendered.current = true;
      } catch (e) {
        console.warn('Failed to render Google button', e);
      }
    }
  }, [callback]);

  useEffect(() => {
    // If the script is already available, init immediately; otherwise script onload will handle it.
    if ((window as any).google?.accounts?.id) {
      init();
    }
  }, [init]);

  useEffect(() => {
    const scriptId = 'google-identity-services';
    if (document.getElementById(scriptId)) return;
    const s = document.createElement('script');
    s.id = scriptId;
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      init();
    };
    document.head.appendChild(s);
  }, [init]);

  return <div ref={btnRef} />;
}
