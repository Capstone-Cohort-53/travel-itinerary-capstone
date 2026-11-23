import {AttributionControl, MapContainer, Marker, TileLayer} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Leaflet's default pin images don't resolve through Vite, so import them as URLs
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/*
 * Browser only: Leaflet touches `window` as soon as it loads, so this file must
 * never run during server rendering. activity-details.tsx loads it with
 * React.lazy after the page has mounted in the browser.
 */

const pin = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
})

export default function ActivityMap({lat, lng, label}: { lat: number, lng: number, label: string }) {
    return (
        // on phones a one-finger drag should scroll the page, not get stuck panning the map;
        // the small square has no +/- buttons: "Open in Google Maps" is right beside it
        <MapContainer attributionControl={false} center={[lat, lng]} zoom={14} scrollWheelZoom={false} dragging={!L.Browser.mobile} zoomControl={false}
                      className="activity-map h-full w-full" aria-label={`Map of ${label}`}>
            {/* OpenStreetMap's tile policy requires this credit to stay visible; here it has no "Leaflet |" prefix, so it fits the small square */}
            <AttributionControl prefix={false}/>
            <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
            />
            <Marker position={[lat, lng]} icon={pin} alt={label}/>
        </MapContainer>
    )
}
