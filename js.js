       /* global google, gmaps, ExtDraggableObject */
       var map = null;
       var directionsDisplay = null;
       var directionsRenderer = new Array(0);
       var directionsService = new google.maps.DirectionsService();
       var dirContainer = null;
       var dynamap = null;

       function showOp(op) {
           document.getElementById('opv').innerHTML = parseInt(parseFloat(op) * 100);
       }

       function initialize() {

           dirContainer = document.getElementById('dir-container');

           // Create an array of styles.
           var greyscaleMap = [
               {
                   featureType: "all",
                   stylers: [{ saturation: -80 }]
               }
           ];

           // Create a new StyledMapType object, passing it the array of styles,
           // as well as the name to be displayed on the map type control.
           var greyMapType = new google.maps.StyledMapType(greyscaleMap,
               {
                   name: "Greyscale"
               });

           // Create a map object, and include the MapTypeId to add
           // to the map type control.
           var mapOptions =
           {
               zoom: 11,
               center: new google.maps.LatLng(51.507674, -0.138016),
               mapTypeControlOptions:
               {
                   mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'greyscale']
               }
           };

           map = new google.maps.Map(document.getElementById('map-container'), mapOptions);

           // Create a renderer for directions and bind it to the map.
           var rendererOptions = {
               map: map,
               polylineOptions: { strokeColor: 'ffffff' }
           };
           directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

           //Associate the styled map with the MapTypeId and set it to display.
           map.mapTypes.set('greyscale', greyMapType);
           map.setMapTypeId('greyscale');

           var opacity = 0.5;
           var url = 'https://webgis.erg.kcl.ac.uk/ArcGIS/rest/services/Combinednow2010/MapServer';
           dynamap = new gmaps.ags.MapOverlay(url, { name: 'ArcGIS', opacity: opacity });
           dynamap.setMap(map);

           var bar = document.getElementById("op");

           var container = document.getElementById("opSlider");

           var range = (parseInt(container.style.width) - parseInt(bar.style.width));

           map.controls[google.maps.ControlPosition.TOP].push(document.getElementById('opContainer'));

           var opSlider = new ExtDraggableObject(bar, { restrictY: true, container: container });

           opSlider.setValueX(range * opacity);

           showOp(opacity);

           google.maps.event.addListener(opSlider, 'drag', function () {

               var op = opSlider.left() / range;

               dynamap.setOpacity(op);

               showOp(op);

           });

           google.maps.event.addDomListener(document.getElementById('less'), 'click', function () {

               var op = Math.max(dynamap.getOpacity() - 0.1, 0);

               dynamap.setOpacity(op);

               opSlider.setValueX(range * op);

               showOp(op);
           });

           google.maps.event.addDomListener(document.getElementById('more'), 'click', function () {

               var op = Math.min(dynamap.getOpacity() + 0.1, 1);

               dynamap.setOpacity(op);

               opSlider.setValueX(range * op);

               showOp(op);
           });

           var startz = document.getElementById('from');
           var startAutocomplete = new google.maps.places.Autocomplete(startz);
           var endz = document.getElementById('to');
           var endAutocomplete = new google.maps.places.Autocomplete(endz);

           startAutocomplete.bindTo('bounds', map);
           endAutocomplete.bindTo('bounds', map);

           google.maps.event.addListener(startAutocomplete, 'place_changed', function () {

               var place = startAutocomplete.getPlace();

               var address = '';

               if (place.address_components) {
                   address = [(place.address_components[0] && place.address_components[0].short_name || ''), (place.address_components[1] && place.address_components[1].short_name || ''), (place.address_components[2] && place.address_components[2].short_name || '')].join(' ');
               }

           });

           // Calculate the route when the auto suggest had added a new 
           google.maps.event.addListener(startAutocomplete, 'place_changed', function () {
               calcRoute();
           });
           google.maps.event.addListener(endAutocomplete, 'place_changed', function () {
               calcRoute();
           });

           calcRoute();
       }

       function showDirections(dirResult, dirStatus) {
           if (dirStatus !== google.maps.DirectionsStatus.OK) {
               alert('Directions failed: ' + dirStatus);
               return;

           }

           // Show directions
           //dirRenderer.setMap(map);
           directionsDisplay.setPanel(dirContainer);
           directionsDisplay.setDirections(dirResult);

           var infowindow = new google.maps.InfoWindow();
           infowindow.setContent(dirResult.routes[0].legs[0].distance.text + "<br>" + dirResult.routes[0].legs[0].duration.text + " ");
           infowindow.setPosition(dirResult.routes[0].legs[0].end_location);
           infowindow.open(map);
       }

       function getSelectedTravelMode() {
           var value = $('input[name="travel-mode"]:checked').val();
           if (value === 'driving') {
               value = google.maps.DirectionsTravelMode.DRIVING;
           } else if (value === 'bicycling') {
               value = google.maps.DirectionsTravelMode.BICYCLING;
           } else if (value === 'walking') {
               value = google.maps.DirectionsTravelMode.WALKING;
           } else if (value === 'transit') {
               value = google.maps.DirectionsTravelMode.TRANSIT;
           } else {
               alert('Unsupported travel mode.');
           }
           return value;

       }

       function getSelectedUnitSystem() {
           if ($('#unit-input').val() === 'metric') {
               return google.maps.DirectionsUnitSystem.METRIC;
           } else {
               return google.maps.DirectionsUnitSystem.IMPERIAL;
           }
       }

       function calcRoute() {

           var fromStr = $('#from').val();
           var toStr = $('#to').val();

           if (fromStr && toStr) {
               var dirRequest = {
                   origin: fromStr,
                   destination: toStr,
                   travelMode: getSelectedTravelMode(), //Dinni Ken
                   unitSystem: getSelectedUnitSystem(), //Dinni Ken
                   provideRouteAlternatives: true
               };

               directionsService.route(dirRequest, function (result, status) {

                   showDirections(result, status);

                   if (directionsRenderer !== null && directionsRenderer.length > 0) {
                       for (var j = 0; j < directionsRenderer.length; j++) {
                           directionsRenderer[j].setMap(null);
                           directionsRenderer[j] = null;
                       }
                       directionsRenderer = new Array(0);
                   }

                   if (status === google.maps.DirectionsStatus.OK) {
                       for (var i = 0; i < result.routes.length; i++) {
                           var rendererOptions = getRendererOptions(i === 0);
                           renderDirections(result, rendererOptions, i);
                       }
                   }

               });

           }
       }

       function getRendererOptions(main_route) {
           var _colour = '#f939e6';
           var _strokeWeight = 2;
           var _strokeOpacity = 0.5;
           var _suppressMarkers = false;

           if (main_route) {
               _colour = '#f30';
               _strokeWeight = 4;
               _strokeOpacity = 1.0;
               _suppressMarkers = false;
           }

           var polylineOptions = { strokeColor: _colour, strokeWeight: _strokeWeight, strokeOpacity: _strokeOpacity };

           var rendererOptions = { draggable: false, suppressMarkers: _suppressMarkers, polylineOptions: polylineOptions };

           return rendererOptions;
       }

       function renderDirections(result, rendererOptions, routeToDisplay) {

           var _colour = '#ff00ff';
           var _strokeWeight = 4;
           var _strokeOpacity = 0.2;
           var _suppressMarkers = false;

           // create new renderer object
           directionsRenderer[routeToDisplay] = new google.maps.DirectionsRenderer({
               draggable: false,
               suppressMarkers: _suppressMarkers,
               polylineOptions: {
                   strokeColor: _colour,
                   strokeWeight: _strokeWeight,
                   strokeOpacity: _strokeOpacity
               }
           });
           directionsRenderer[routeToDisplay].setMap(map);
           directionsRenderer[routeToDisplay].setDirections(result);
           directionsRenderer[routeToDisplay].setRouteIndex(routeToDisplay);
       }

       $(document).ready(function () {

           $('#travel-mode').change(function () {
               calcRoute();
           });

           $('#unit-input').change(function () {
               calcRoute();
           });

           $('#go').click(function () {
               calcRoute();
           });

           $('#from-to :radio').click(function () {
               calcRoute();
           });

           $('#from-to').submit(function (e) {
               e.preventDefault();
               calcRoute();
           });

           initialize();
       });