function Marker() {

    this.markerImage_       = null;
    this.markerImageHover_  = null;

    var markerOptions = {
        // flat: true, // no shadow
        // raiseOnDrag: false,
        icon: this.markerImage_
    };

    this.marker_ = new google.maps.Marker( markerOptions );
    this.marker_.bindTo( "title", this );
    this.marker_.bindTo( "position", this );

    if ( this.get("state") > 1 ) {
        this.marker_.setMap( map );
    }

    var me = this;

    google.maps.event.addListener( this, "typeconfig_changed", function(e) {
        var typeConfig = this.get( "typeConfig" );
        this.markerImage_ = typeConfig.icon;
        this.markerImageHover_ = typeConfig.icon;
    });

    google.maps.event.addListener( this.marker_, "mouseover", function(e) {
        var state = me.get( "state" );
        if ( state < 3 ) {
            me.set( "state", 3 );
        }
    });

    google.maps.event.addListener( this.marker_, "mouseout", function(e) {
        var state = me.get( "state" );
        if ( state == 3 ) {
            me.set( "state", 2 );
        }
    });

    google.maps.event.addListener(this.marker_, "click", function(e) {
        var state = me.get( "state" );
        if ( state != 4 ) {
            me.set( "state", 4 );
        } else {
            me.set( "state", 3 );
        }
    });

    google.maps.event.addListener(this, "state_changed", function() {
        var state = this.get( "state" );
        
        if ( state > 1 ) {

            if ( !this.marker_.getMap() ) {
                this.marker_.setMap( map );
            }

            if ( state == 2 ) {
                this.marker_.setIcon( this.markerImage_ );
            } else {
                this.marker_.setIcon( this.markerImageHover_ );
            }
        } else {
            this.marker_.setMap( null );
        }
    });

    // google.maps.event.addListener( this, "iconurl_changed", function() {
    //     this.createIcon();
    //     if ( this.marker_ ) {
    //         this.marker_.setIcon( this.markerImage_ );
    //     }
    // });

    // google.maps.event.addListener( this, "hovericonurl_changed", function() {
    //     this.createHoverIcon();
    // });

}


Marker.prototype = new google.maps.MVCObject();

Marker.prototype.remove = function() {
    this.unbindAll();
    if(this.markerImage_) {
        delete this.markerImage_;
    }
    if(this.markerImageHover_) {
        delete this.markerImageHover_;
    }
    if ( this.marker_ ) {
        this.marker_.setMap( null );
        delete this.marker_;
    }
}

Marker.prototype.createIcon = function() {
    var iconUrl = this.get('iconUrl');
    if ( iconUrl ) {
        if ( this.markerImage_ ) {
            delete this.markerImage_;
        }
        var anchor = new google.maps.Point(24,24);
        this.markerImage_ = new google.maps.MarkerImage(
            iconUrl, 
            null, 
            null, 
            anchor,
            null
        );
    } else {
        this.markerImage_ = null;
    }
}

Marker.prototype.createHoverIcon = function() {
    var hoverIconUrl = this.get('hoverIconUrl');
    if ( hoverIconUrl ) {
        if ( this.markerImageHover_ ) {
            delete this.markerImageHover_;
        }
        var anchor = new google.maps.Point(24,24);
        this.markerImageHover_ = new google.maps.MarkerImage(
            hoverIconUrl, 
            null, 
            null, 
            anchor, 
            null
        );
    } else {
        this.markerImageHover_ = null;
    }
}
