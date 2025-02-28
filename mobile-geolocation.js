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
    
    // Auf Änderungen der Position reagieren
    geolocation.on('change:position', function() {
      var coordinates = geolocation.getPosition();
      if (coordinates) {
        positionFeature.setGeometry(new ol.geom.Point(coordinates));
        map.getView().animate({
          center: coordinates,
          zoom: 18,
          duration: 500
        });
        
        // Zeige Standortinformationen an
        showLocationInfo(coordinates, geolocation.getAccuracy());
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
        "</div>";
      infoDiv.style.display = 'block';
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
      gpsButton: gpsButton
    };
  }
  
  // Exportiere die Funktion
  window.initMobileGeolocation = initMobileGeolocation;
