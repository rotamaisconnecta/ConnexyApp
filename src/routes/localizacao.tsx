import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import locationPermissionReference from "@/assets/location-permission-reference.png";

export const Route = createFileRoute("/localizacao")({
  head: () => ({ meta: [{ title: "Permitir localizacao | Connexy" }] }),
  component: LocationPermission,
});

function LocationPermission() {
  const nav = useNavigate();
  const [requesting, setRequesting] = useState(false);

  function continueToHome() {
    nav({ to: "/home" });
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      continueToHome();
      return;
    }

    setRequesting(true);
    navigator.geolocation.getCurrentPosition(continueToHome, continueToHome, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 300_000,
    });
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="relative mx-auto w-full max-w-[430px]">
        <img
          className="block h-auto w-full"
          src={locationPermissionReference}
          alt="Connexy solicita permissao para acessar sua localizacao"
        />
        <button
          type="button"
          onClick={requestLocation}
          disabled={requesting}
          aria-label="Permitir localizacao"
          className="absolute left-[7.6%] top-[86%] h-[5.1%] w-[84.8%] disabled:cursor-wait focus:outline-none"
        />
        <button
          type="button"
          onClick={continueToHome}
          aria-label="Agora nao"
          className="absolute left-[7.6%] top-[92.3%] h-[5.1%] w-[84.8%] focus:outline-none"
        />
      </div>
    </main>
  );
}
