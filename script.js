
        $('#api').on('click', function (e) {
            e.preventDefault();
            axios.get('posicoes.json')
                .then(function (response) {
                    var rota = response.data;

                    // Armazena no LocalStorage
                    localStorage.setItem('rota', JSON.stringify(rota));
                });
        });

        // Obtém do LocalStorage
        var objSalvo = JSON.parse(localStorage.getItem('rota'));

        var MapPoints = objSalvo;

        console.log('Posições do Mapa', MapPoints)

        var directionsDisplay;
        var directionsService = new google.maps.DirectionsService();
        var map;

        function initialize() {
            directionsDisplay = new google.maps.DirectionsRenderer({
                suppressMarkers: true
            });

            if (jQuery('#map').length > 0) {

                var locations = MapPoints;

                map = new google.maps.Map(document.getElementById('map'), {
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    scrollwheel: false
                });
                directionsDisplay.setMap(map);

                var infowindow = new google.maps.InfoWindow();
                var flightPlanCoordinates = [];
                var bounds = new google.maps.LatLngBounds();

                for (i = 0; i < locations.length; i++) {
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(locations[i].latitude, locations[i].longitude),
                        map: map
                    });
                    flightPlanCoordinates.push(marker.getPosition());
                    bounds.extend(marker.position);

                    google.maps.event.addListener(marker, 'click', (function (marker, i) {
                        return function () {
                            infowindow.setContent(locations[i].dateTime);
                            infowindow.open(map, marker);
                        }
                    })(marker, i));
                }

                map.fitBounds(bounds);

                // directions service configuration
                var start = flightPlanCoordinates[0];
                var end = flightPlanCoordinates[flightPlanCoordinates.length - 1];
                var waypts = [];
                for (var i = 1; i < flightPlanCoordinates.length - 1; i++) {
                    waypts.push({
                        location: flightPlanCoordinates[i],
                        stopover: true
                    });
                }
                calcRoute(start, end, waypts);
            }
        }

        function calcRoute(start, end, waypts) {
            var request = {
                origin: start,
                destination: end,
                waypoints: waypts,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            };
            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                    var route = response.routes[0];
                }
            });
        }
        google.maps.event.addDomListener(window, 'load', initialize);

