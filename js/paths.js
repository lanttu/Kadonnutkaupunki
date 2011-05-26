function Paths() {
    this.polylines_ = new google.maps.MVCArray();

    google.maps.event.addListener( this, "paths_changed", function() {

        var polylines = this.polylines_;
        var paths = this.get( "paths" );
        var color = this.getPathColor();

        paths.forEach( function( path ,i ) {
            var polyline = new google.maps.Polyline({
                map: map,
                path: path,
                strokeColor: color
            });
            polylines.push( polyline );
        });

    });

    google.maps.event.addListener( this, "state_changed", function() {
        var state = this.get( "state" );
        if ( state > 1 ) {
            this.show();
        } else {
            this.hide();
        }
    });

}

Paths.prototype = new google.maps.MVCObject();

Paths.prototype.getPathColor = function() {
    var config = this.get( "typeConfig" );
    try {
        return config.color;
    } catch ( e ) {
        logMessage( "Config doesnt have color " );
        return "#FFFFFF";
    }
}


Paths.prototype.show = function() {
    if ( this.polylines_ ) {
        this.polylines_.forEach(function( line, i ) {
            line.setMap( map )
        });
    }
}

Paths.prototype.hide = function() {
    if ( this.polylines_ ) {
        this.polylines_.forEach(function( line, i ) {
            line.setMap( null )
        });
    }
}

Paths.prototype.remove = function() {
    if ( this.polylines_ ) {
        this.polylines_.forEach(function( line, i ) {
            delete line;
        });
    }
    this.unbindAll();

}
