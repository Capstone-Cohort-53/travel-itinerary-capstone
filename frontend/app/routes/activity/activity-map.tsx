import {MapContainer, Marker, TileLayer} from "react-leaflet";
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
        // the +/- buttons and "Open larger map" still work there
        <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} dragging={!L.Browser.mobile}
                      className="h-64 w-full sm:h-72" aria-label={`Map of ${label}`}>
            {/* OpenStreetMap's tile policy requires this credit to stay visible */}
            <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
            />
            <Marker position={[lat, lng]} icon={pin} alt={label}/>
        </MapContainer>
    )
}
