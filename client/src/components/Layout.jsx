import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { settingsApi } from '../services/api';

export default function Layout() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    settingsApi.get().then(setSettings).catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Outlet context={{ settings }} />
      </main>
      <Footer settings={settings} />
    </>
  );
}
