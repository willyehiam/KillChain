# Taiwan Civilian Rail Access Research

This packet records the public Taiwan Railways station directory and the latest station level annual passenger flow file found in the official prebookmark catalog.

The packet deliberately keeps three different facts separate:

1. `civilian_rail_stations.geojson` contains 244 official directory points with published GPS coordinates.
2. `rail_station_passenger_activity_2021.ndjson` contains 239 matched station passenger observations for calendar year 2021.
3. `rail_line_freight_activity_2021.ndjson` contains 13 line level freight observations that are not allocated to stations.

The station directory was downloaded on 7 August 2026 from a mutable official endpoint. It is useful as a current reference layer, but it is not accepted as opening state for the 1 September 2025 bookmark. The 2021 flow file is historical and was cataloged before the bookmark.

The official freight data withholds station detail for commercial confidentiality. KillWeb preserves that uncertainty. No line total may be assigned to a station, port, depot, train, route segment, military formation, or available lift pool without separate evidence.

This is a civilian access research packet. A station point is not a complete facility, a statement of capacity, proof of current service, proof of military access, or a target nomination.
