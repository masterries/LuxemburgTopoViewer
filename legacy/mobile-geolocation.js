// Mobile Geolocation für Luxembourg Parcel Search Tool
// Diese Datei fügt GPS-Funktionalität für Mobilgeräte hinzu

function initMobileGeolocation(map) {
    // Erstelle einen Button für die GPS-Funktion
    var gpsButton = document.createElement('button');
    gpsButton.id = 'gpsButton';
    gpsButton.innerHTML = '<i class="fa fa-crosshairs"></i> Mein Standort';
    gpsButton.style.cssText = `
      position: absolute;
      bottom: 70px;
      right: 10px;
      background: #4285F4;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px;
      cursor: pointer;
      z-index: 1000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    // Erstelle eine Quelle für den GPS-Marker
    var gpsSource = new ol.source.Vector();
    var gpsLayer = new ol.layer.Vector({
      source: gpsSource,
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({
            color: '#4285F4'
          }),
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 2
          })
        })
      })
    });
    
    // Füge die GPS-Ebene zur Karte hinzu
    map.addLayer(gpsLayer);
    
    // Füge den GPS-Button zum Dokument hinzu
    document.body.appendChild(gpsButton);
    
    // GPS-Genauigkeitskreis
    var accuracyFeature = new ol.Feature();
    gpsSource.addFeature(accuracyFeature);
    
    // GPS-Punktmarkierung
    var positionFeature = new ol.Feature();
    positionFeature.setStyle(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({
            color: '#4285F4'
          }),
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 2
          })
        })
      })
    );
    gpsSource.addFeature(positionFeature);
    
    // Tracking-Modus: 'once' oder 'continuous'
    var trackingMode = 'once';
    var trackingButton = document.createElement('button');
    trackingButton.id = 'trackingButton';
    trackingButton.innerHTML = '<i class="fa fa-route"></i> Tracking-Modus';
    trackingButton.style.cssText = `
      position: absolute;
      bottom: 120px;
      right: 10px;
      background: #777;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px;
      cursor: pointer;
      z-index: 1000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(trackingButton);
    
    // Tracking-Button-Listener
    trackingButton.addEventListener('click', function() {
      if (trackingMode === 'once') {
        trackingMode = 'continuous';
        trackingButton.style.backgroundColor = '#ff4081';
        trackingButton.innerHTML = '<i class="fa fa-route"></i> Kontinuierlich';
      } else {
        trackingMode = 'once';
        trackingButton.style.backgroundColor = '#777';
        trackingButton.innerHTML = '<i class="fa fa-route"></i> Tracking-Modus';
      }
    });
    
    // Geolocation-Objekt erstellen
    var geolocation = new ol.Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
        maximumAge: 3000
      },
      projection: map.getView().getProjection()
    });
    
    // GPS-Button-Listener
    gpsButton.addEventListener('click', function() {
      // Starte oder stoppe Tracking
      if (geolocation.getTracking()) {
        geolocation.setTracking(false);
        gpsButton.style.backgroundColor = '#4285F4';
        gpsButton.innerHTML = '<i class="fa fa-crosshairs"></i> Mein Standort';
        // Entferne Marker
        positionFeature.setGeometry(undefined);
        accuracyFeature.setGeometry(undefined);
      } else {
        geolocation.setTracking(true);
        gpsButton.style.backgroundColor = '#ff4081';
        gpsButton.innerHTML = '<i class="fa fa-crosshairs"></i> GPS aktiv';
      }
    });
    
    // Route aufzeichnen
    var routeCoordinates = [];
    var routeFeature = new ol.Feature();
    routeFeature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#4285F4',
        width: 4
      })
    }));
    gpsSource.addFeature(routeFeature);
    
    // Auf Änderungen der Position reagieren
    geolocation.on('change:position', function() {
      var coordinates = geolocation.getPosition();
      if (coordinates) {
        positionFeature.setGeometry(new ol.geom.Point(coordinates));
        
        // Für Routenaufzeichnung (nur im kontinuierlichen Modus)
        if (trackingMode === 'continuous') {
          // Füge Koordinaten zur Route hinzu
          routeCoordinates.push(coordinates);
          if (routeCoordinates.length > 1) {
            routeFeature.setGeometry(new ol.geom.LineString(routeCoordinates));
          }
        }
        
        // Nur im einmaligen Modus zur Position zoomen
        if (trackingMode === 'once') {
          map.getView().animate({
            center: coordinates,
            zoom: 18,
            duration: 500
          });
        } else {
          // Im kontinuierlichen Modus nur die Karte verschieben, nicht zoomen
          map.getView().animate({
            center: coordinates,
            duration: 500
          });
        }
        
        // Zeige Standortinformationen an
        showLocationInfo(coordinates, geolocation.getAccuracy());
        
        // Wenn im Einmalmodus, beende das Tracking nach einmaliger Nutzung
        if (trackingMode === 'once') {
          setTimeout(function() {
            geolocation.setTracking(false);
            gpsButton.style.backgroundColor = '#4285F4';
            gpsButton.innerHTML = '<i class="fa fa-crosshairs"></i> Mein Standort';
          }, 10000); // Nach 10 Sekunden ausschalten (spart Batterie)
        }
      }
    });
    
    // Auf Änderungen der Genauigkeit reagieren
    geolocation.on('change:accuracyGeometry', function() {
      accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    });
    
    // Fehlerbehandlung für Geolocation
    geolocation.on('error', function(error) {
      alert('Geolocation-Fehler: ' + error.message);
      gpsButton.style.backgroundColor = '#4285F4';
      gpsButton.innerHTML = '<i class="fa fa-crosshairs"></i> Mein Standort';
      geolocation.setTracking(false);
    });
    
    // Button zum Zurücksetzen der Route
    var resetRouteButton = document.createElement('button');
    resetRouteButton.id = 'resetRouteButton';
    resetRouteButton.innerHTML = '<i class="fa fa-trash"></i> Route löschen';
    resetRouteButton.style.cssText = `
      position: absolute;
      bottom: 170px;
      right: 10px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px;
      cursor: pointer;
      z-index: 1000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      display: none;
    `;
    document.body.appendChild(resetRouteButton);
    
    // Reset-Button-Listener
    resetRouteButton.addEventListener('click', function() {
      routeCoordinates = [];
      routeFeature.setGeometry(undefined);
      resetRouteButton.style.display = 'none';
    });
    
    // Wenn wir eine Route haben, zeigen wir den Reset-Button
    setInterval(function() {
      if (routeCoordinates.length > 1) {
        resetRouteButton.style.display = 'block';
      }
    }, 1000);
    
    // Funktion zum Anzeigen der Standortinformationen
    function showLocationInfo(coordinates, accuracy) {
      // Konvertiere Koordinaten von EPSG:3857 zu EPSG:4326 (WGS84)
      var wgs84Coords = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
      
      // Formatiere die Koordinaten
      var lat = wgs84Coords[1];
      var lon = wgs84Coords[0];
      
      // Konvertiere Dezimalgrad zu DMS (Grad, Minuten, Sekunden)
      var latDMS = convertToDMS(lat, 'NS');
      var lonDMS = convertToDMS(lon, 'EW');
      
      // Zeige Standortinfo
      var infoDiv = document.getElementById('infoDiv');
      infoDiv.innerHTML = 
        "<div class='infoTitle'>Mein Standort</div>" +
        "<div class='featureInfo'>" +
        "<div>Koordinaten:</div><div>" + latDMS + " " + lonDMS + "</div>" +
        "<div>Dezimal:</div><div>" + lat.toFixed(6) + ", " + lon.toFixed(6) + "</div>" +
        "<div>Genauigkeit:</div><div>" + Math.round(accuracy) + " m</div>" +
        (routeCoordinates.length > 1 ? 
          "<div>Route:</div><div>" + routeCoordinates.length + " Punkte, " + 
          calculateRouteLength(routeCoordinates).toFixed(2) + " km</div>" : "") +
        "</div>";
      infoDiv.style.display = 'block';
    }
    
    // Hilfsfunktion: Berechne Streckenlänge in km
    function calculateRouteLength(coordinates) {
      var length = 0;
      for (var i = 0; i < coordinates.length - 1; i++) {
        // Konvertiere zu WGS84 für korrekte Distanzberechnung
        var start = ol.proj.transform(coordinates[i], 'EPSG:3857', 'EPSG:4326');
        var end = ol.proj.transform(coordinates[i+1], 'EPSG:3857', 'EPSG:4326');
        length += haversineDistance(start, end);
      }
      return length;
    }
    
    // Distanzberechnung mit Haversine-Formel (präzise für geografische Koordinaten)
    function haversineDistance(coord1, coord2) {
      // Radius der Erde in km
      var R = 6371;
      var dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
      var dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
      var lat1 = coord1[1] * Math.PI / 180;
      var lat2 = coord2[1] * Math.PI / 180;
      
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c;
    }
    
    // Hilfsfunktion: Konvertiere Dezimalgrad zu DMS
    function convertToDMS(degree, direction) {
      var absolute = Math.abs(degree);
      var degrees = Math.floor(absolute);
      var minutesNotTruncated = (absolute - degrees) * 60;
      var minutes = Math.floor(minutesNotTruncated);
      var seconds = Math.floor((minutesNotTruncated - minutes) * 60);
      
      var directionChar = '';
      if (direction === 'NS') {
        directionChar = degree >= 0 ? 'N' : 'S';
      } else {
        directionChar = degree >= 0 ? 'E' : 'W';
      }
      
      return degrees + "°" + minutes + "′" + seconds + "″" + directionChar;
    }
    
    // Füge Font Awesome für Icons hinzu (wenn nicht bereits vorhanden)
    if (!document.getElementById('font-awesome')) {
      var link = document.createElement('link');
      link.id = 'font-awesome';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      document.head.appendChild(link);
    }
    
    return {
      geolocation: geolocation,
      gpsButton: gpsButton,
      routeData: function() {
        return {
          coordinates: routeCoordinates.map(function(coord) {
            return ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
          }),
          length: calculateRouteLength(routeCoordinates)
        };
      },
      clearRoute: function() {
        routeCoordinates = [];
        routeFeature.setGeometry(undefined);
      }
    };
  }
  
  // Exportiere die Funktion
  window.initMobileGeolocation = initMobileGeolocation;
