"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polygon,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { BASE_API_URL } from "@/utils/constants";

const createCustomIcon = (isCompetitor: boolean, name: string) => {
  const dotColor = isCompetitor ? "black" : "green";
  const labelBg = isCompetitor ? "#fff" : "#000";
  const textColor = !isCompetitor ? "#fff" : "#000";

  return L.divIcon({
    className: "custom-pin-icon",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateY(-40px);
        font-family: sans-serif;
        position: relative;
      ">
        <!-- Label -->
        <div style="
          background: ${labelBg};
          color: ${textColor};
          padding: 4px 8px;
          border-radius: 14px;
          font-size: 12px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          position: relative;
        " title="${name}">
          ${name}
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${labelBg};
          "></div>
        </div>

        <!-- Connecting Line -->
        <div style="
          width: 2px;
          height: 10px;
          background: #555;
          margin: 2px 0;
        "></div>

        <!-- Dot -->
        <div style="
          width: 10px;
          height: 10px;
          background: ${dotColor};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
        "></div>
      </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 60], // ensures alignment with the bottom dot
  });
};

function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);
  return null;
}

export default function StoreMap() {
  const mapRef = useRef<L.Map>(null);
  const [city, setCity] = useState("");
  const [storeType, setStoreType] = useState("");
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [IsLoading, setIsLoading] = useState(false);

  const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(
    null
  ); // NEW

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_API_URL}/storespot/recommend?city=${city}&store_type=${storeType}`
      );
      setCompetitors(response.data.competitors);
      setSuggested(response.data.gemini_summary.suggestions);
      setSummary(response.data.gemini_summary.summary);
      setCity("");
      setStoreType("");
      console.log("API Response", response.data);
    } catch (err) {
      console.error("API Error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (suggested?.length > 0 && mapRef.current) {
      mapRef.current.flyTo([suggested[0].latitude, suggested[0].longitude], 14); // Or keep current zoom with mapRef.current.getZoom()
    }
  }, [suggested]);

  function SetMapRef({
    mapRef,
  }: {
    mapRef: React.MutableRefObject<L.Map | null>;
  }) {
    const map = useMap();

    useEffect(() => {
      mapRef.current = map;
    }, [map, mapRef]);

    return null;
  }

  return (
    <div className="allocation-body">
      <div
        className="position-relative"
        style={{ display: "flex", flexDirection: "row", gap: "24px" }}
      >
        <div className="form-and-map" style={{ flex: 1, position: "relative" }}>
          <div className="form-area">
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", gap: "10px", paddingBottom: "10px" }}
            >
              <input
                type="text"
                placeholder="Enter City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Enter Store Type"
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                required
              />
              <button style={{ backgroundColor: "#000000" }} type="submit">
                {IsLoading ? "Loading..." : "Suggest Location"}
              </button>
            </form>
          </div>
          <div className="map-wrapper">
            <MapContainer
              center={[13.002, 80.256]}
              zoom={5}
              style={{ height: "775px", width: "100%" }}
              maxBoundsViscosity={1.0}
            >
              <SetMapRef mapRef={mapRef} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {/* {(suggested || currentLocation) && (
                <>
                  <FlyToLocation
                    position={
                      suggested?.length > 0
                        ? [suggested[0].latitude, suggested[0].longitude]
                        : currentLocation!
                    }
                  />
                </>
              )} */}
              {competitors.map((c, i) => (
                <Marker
                  key={i}
                  position={[c.location.lat, c.location.lng]}
                  icon={createCustomIcon(true, c.name)}
                ></Marker>
              ))}
              {suggested?.length > 0 &&
                suggested.map((c, i) => (
                  <Marker
                    key={i}
                    position={[c.latitude, c.longitude]}
                    icon={createCustomIcon(false, `${i + 1}`)}
                    eventHandlers={{
                      click: () => setSelectedSuggestion(c), // Set selected suggestion
                    }}
                  ></Marker>
                ))}
              {suggested?.length > 0 && (
                <>
                  {/* Concentric Circles */}
                  {[50, 100, 200].map((radius, idx) => (
                    <Circle
                      key={idx}
                      center={[suggested[0].latitude, suggested[0].longitude]}
                      radius={radius}
                      pathOptions={{
                        color: "#2b6cb0",
                        opacity: 0.25,
                        fillOpacity: 0.1,
                      }}
                    />
                  ))}
                </>
              )}
              {/* Suggestion Info Card - floating over map */}
              {selectedSuggestion && (
                <div className="suggestion-card-floating">
                  <button
                    className="close-btn"
                    onClick={() => setSelectedSuggestion(null)}
                  >
                    ×
                  </button>
                  <h3>
                    <span className="card-heading-decor">
                      Suggestion Details
                    </span>
                  </h3>
                  <div className="card-row">
                    <strong>Area:</strong>
                    <span>{selectedSuggestion.area}</span>
                  </div>
                  <div className="card-row">
                    <strong>Confidence Score:</strong>
                    <span>{selectedSuggestion.confidence_score}</span>
                  </div>
                  <div className="card-row">
                    <strong>Reason:</strong>
                    <span>{selectedSuggestion.reason}</span>
                  </div>
                  <div className="card-row">
                    <strong>Summary:</strong>
                    <span>{selectedSuggestion.summary}</span>
                  </div>
                </div>
              )}
            </MapContainer>
          </div>
        </div>
      </div>
      <style jsx>{`
        .allocation-body {
          min-height: 100vh;
          background: #F9F3EF;
          margin-left: 320px;
          padding: 30px 3px 50px;
        }
          .position-relative {
          display: flex;
          flex-direction: row;
          gap: 24px;
        }
        .form-and-map {
          flex: 1;
          min-width: 0;
        }
 .suggestion-card-floating {
          position: absolute;
          right: 24px;
          bottom: 24px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(44, 62, 80, 0.18);
          padding: 24px 20px 20px 20px;
          min-width: 260px;
          max-width: 340px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fadeInUp 0.3s;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .suggestion-card-floating h3 {
          margin: 0 0 10px 0;
          font-size: 1.2rem;
          color: #2b6cb0;
          text-align: left;
        }
        .card-heading-decor {
          display: inline-block;
          padding-bottom: 3px;
          border-bottom: 3px solid #2b6cb0;
          background: linear-gradient(90deg, #e0e7ff 60%, #fff 100%);
          border-radius: 2px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .card-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
        }
        .card-row strong {
          color: #555;
          font-size: 0.97rem;
        }
        .card-row span {
          font-size: 1.05rem;
          color: #222;
          background: #f7fafc;
          border-radius: 4px;
          padding: 2px 6px;
          margin-top: 2px;
        }
        .close-btn {
          position: absolute;
          top: 10px;
          right: 12px;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #888;
          cursor: pointer;
        }
        @media (max-width: 900px) {
          .suggestion-card-floating {
            right: 8px;
            left: 8px;
            bottom: 8px;
            max-width: 98vw;
            min-width: 0;
            padding: 18px 10px 14px 14px;
          }
        }
        }
        .form-area {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        input {
          padding: 10px;
          font-size: 1rem;
          flex: 1;
          min-width: 140px;
        }
        button {
          padding: 10px 20px;
          background: #2b6cb0;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .map-wrapper {
        min-height: 100vh;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
         width: 100%;
        }
        .leaflet-map {
          height: 100%;
          width: 100%;
        }
        @media (max-width: 768px) {
          .form-area {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
