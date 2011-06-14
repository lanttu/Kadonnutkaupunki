/* 
    States:
    1: Hidden
    2: Marker and images shown
    3: Marker hover
    4: Clicked - Dialog open
*/

 

function Gwikimodel() {
    // console.info('Gwikimodel created');
    if ( !(this instanceof arguments.callee) ) {
       throw new Error("Constructor called as a function");
    }

    this.marker_ = null;
    this.dialog_ = null;
    this.overlayHandler_ = null;
    this.paths_ = null;

    google.maps.event.addListener( this, "icon_changed", function() {
        var icon = this.get( "icon" );
        if ( icon && icon != "undefined" ) {
            this.set(
                "iconUrl", 
                "/imgs/symbols/" + this.get("type") + "/" + icon
            );
            this.set(
                "hoverIconUrl", 
                "/imgs/symbols/" + this.get("type") + "/" 
                    + icon.replace("_def.", "_hover.")
            );
        } else {
            this.set( "iconUrl", null );
            this.set( "hoverIconUrl", null );
        }
    });

    google.maps.event.addListener( this, "overlayimage_changed", function() {
        this.set(
            "overlayImageUrl", 
            wikiUrl + "CloudImages?action=AttachFile&do=get&target="
                + this.get("overlayImage")
        );
    });

    google.maps.event.addListener( this, "overlayimages_changed", function() {
        var urls = new google.maps.MVCArray();
        var images = this.get( "overlayImages" );
        images.forEach( function(img, i) {
            urls.push(
                wikiUrl + "CloudImages?action=AttachFile&do=get&target=" + img
            );
        });
        this.set( "overlayImageUrls", urls );
    });

    google.maps.event.addListener(this, 'type_changed', function() {
        var type = this.get( "type" );
        var typeConfig = getTypeConfig( type );

        this.set( "typeConfig", typeConfig );
    });

    google.maps.event.addListener(this, "name_changed", function() {
        // Use name as default title
        if ( !this.get("title") ) {
            this.set( "title", this.get("name") );
        }
    });

    this.set( "iconUrl", null );
    this.set( "hoverIconUrl", null );

    this.set( "type", "Tapahtuma" );
    this.set( "state", 1 );
    this.set( "position", null );
    this.set( "bounds", null );
    this.set( "categories", new google.maps.MVCArray() );
    this.set( "map", map );
    this.set( "editState", 1 );
    this.set( "paths", null );
}

Gwikimodel.prototype = new google.maps.MVCObject();


Gwikimodel.prototype.init = function( state ) {
    if ( state == undefined ) {
        state = 1;
    }

    google.maps.event.addListener(this, "state_changed", function(e) {
        var state = this.get('state');
        // console.info(state);
        if ( this.dialog_ == null && state > 3 ) {
            this.createContentDialog();
        }

        if ( this.marker_ == null && state > 1 ) {
            this.createMarker();
        }


        if ( this.overlayHandler_ == null 
            && this.get("bounds") != null
            && state > 1 ) {

            this.createOverlays();
        }

        if ( this.paths_ == null && this.get( "paths") != null && state > 1 ) {
            this.createPaths();
        }

    });
    this.set('state', state);


}

Gwikimodel.prototype.createMarker = function() {
    // TODO: Create marker only for specific types
    this.marker_ = new Marker();
    this.marker_.bindTo( "typeConfig", this );
    this.marker_.bindTo( "state", this );
    this.marker_.bindTo( "title", this );
    this.marker_.bindTo( "iconUrl", this );
    this.marker_.bindTo( "hoverIconUrl", this );
    this.marker_.bindTo( "position", this );
}

Gwikimodel.prototype.removeMarker = function() {
    if ( this.marker_ ) {
        this.marker_.remove();
        this.marker_ = null;
    }
}

Gwikimodel.prototype.createPaths = function() {
    this.paths_ = new Paths();
    this.paths_.bindTo( "typeConfig", this );
    this.paths_.bindTo( "paths", this );
    this.paths_.bindTo( "state", this );
}

Gwikimodel.prototype.createOverlays = function() {
    this.overlayHandler_ = new OverlayHandler();
    this.overlayHandler_.bindTo('map', this);
    this.overlayHandler_.bindTo('state', this);
    this.overlayHandler_.bindTo('name', this);
    this.overlayHandler_.bindTo('bounds', this);
    this.overlayHandler_.bindTo('overlayImageUrl', this);
    this.overlayHandler_.bindTo('overlayImageUrls', this);
    this.overlayHandler_.init();
}

Gwikimodel.prototype.removeOverlays = function() {
    if(this.overlayHandler_) {
        this.overlayHandler_.remove();
        this.overlayHandler_ = null;
    }
}

Gwikimodel.prototype.createContentDialog = function() {
    // console.info('createContentDialog');
    this.dialog_ = new ContentDialog(
        // this.get('title'), 
        this.get('name'),
        this.get('class')
    );
    this.dialog_.bindTo('title', this);
    this.dialog_.bindTo('state', this);
    this.dialog_.bindTo('position', this);
}



Gwikimodel.prototype.removeDialog = function() {
    if(this.dialog_) {
        // console.info('Model.removeDialog: '+this.get('name'));
        this.dialog_.setMap(null);
        delete this.dialog_;
        this.dialog_ = null;
    }
}


Gwikimodel.prototype.show = function() {
    this.set('state', 2);
}
Gwikimodel.prototype.hide = function() {
    this.set('state', 1);
}





// Converts gwikicoordinates string to LatLng object
function coordsToLatLng(gwikicoordinates) {
    var coordinates = gwikicoordinates.split(',', 2);
    return new google.maps.LatLng(coordinates[0], coordinates[1]);
}

// Converts LatLng object to gwikicoordinates string
function latLngToCoords(latLng) {
    var coords = latLng.lat() + ', '+latLng.lng();
    return coords;
}

function gwikiboundsToLatLngBounds(gwikibounds) {
    // console.info(gwikibounds);
    var coordinates = gwikibounds.split(',', 4);
    var l1 = new google.maps.LatLng(coordinates[0], coordinates[1]);
    var l2 = new google.maps.LatLng(coordinates[2], coordinates[3]);
    return new google.maps.LatLngBounds(l1, l2);
}

function latLngBoundsToGwikibounds(latLngBounds) {
    var sw = latLngBounds.getSouthWest();
    var ne = latLngBounds.getNorthEast();
    
    return latLngToCoords(sw) + ', ' + latLngToCoords(ne);
}
