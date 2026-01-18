import { useEffect } from 'react';
import { GEOFENCE_TARGET } from '../constants';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const useGeofence = () => {
  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(
          latitude, 
          longitude, 
          GEOFENCE_TARGET.lat, 
          GEOFENCE_TARGET.lng
        );

        if (dist <= GEOFENCE_TARGET.radiusMeters) {
          // Check if we already notified this session
          if (!sessionStorage.getItem('geofence_notified')) {
            if (Notification.permission === "granted") {
              new Notification("Welcome to UKRA HQ Area!", {
                body: "You are within 500m of our headquarters. Visit us for a coffee!",
                icon: "/icon.png"
              });
            } else if (Notification.permission !== "denied") {
               Notification.requestPermission();
            }
            sessionStorage.setItem('geofence_notified', 'true');
          }
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);
};