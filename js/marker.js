function Marker() {

    this.markerImage_       = null;
    this.markerImageHover_  = null;

    var me = this;

    google.maps.event.addListener(this, 'position_changed', function() {
        if(!this.marker_ && this.get('position')) {
            // console.info('S:'+this.get('state'));
            if(this.get('state') > 1)
                var map = this.get('map');
            else
                var map = null;
            var markerOptions = {
                position: this.get('position'),
                flat: true, // no shadow
                raiseOnDrag: false,
                map: map
            };

            this.marker_ = new google.maps.Marker(markerOptions);
            this.marker_.bindTo('title', this, 'name');
            this.marker_.bindTo('position', this);
            this.marker_.bindTo('state', this);

            this.marker_.setIcon(this.markerImage_);

            google.maps.event.addListener(this.marker_, 'mouseover', function(e) {
                var state = this.get('state');
                if(state < 3)
                    this.set('state', 3);
            });
            google.maps.event.addListener(this.marker_, 'mouseout', function(e) {
                var state = this.get('state');
                if(state == 3)
                    this.set('state', 2);
            });
            google.maps.event.addListener(this.marker_, 'click', function(e) {
                var state = this.get('state');
                if(state != 4)
                    this.set('state', 4);
                else
                    this.set('state', 3);
            });
        }
    });

    google.maps.event.addListener(this, 'iconurl_changed', function() {
        this.createIcon();
        if(this.marker_)
            this.marker_.setIcon(this.markerImage_);
    });
    google.maps.event.addListener(this, 'hovericonurl_changed', function() {
        this.createHoverIcon();
    });
    google.maps.event.addListener(this, 'editstate_changed', function() {
        var editState = this.get('editState');
        // console.info('Marker.editstate_changed: '+editState);
        if(this.marker_) {
            if(editState < 4)
                this.marker_.setDraggable(true);
            else
                this.marker_.setDraggable(false);
                
        }
    });

    google.maps.event.addListener(this, 'state_changed', function() {
        var state = this.get('state');
        // console.info('Marker.state_changed: '+state);
        if(!this.marker_)
            return;
        
        if(state > 1) {
            if(!this.marker_.getMap())
                this.marker_.setMap(this.get('map'));
            if(state == 2)
                this.marker_.setIcon(this.markerImage_);
            else
                this.marker_.setIcon(this.markerImageHover_);
        }
        else
            this.marker_.setMap(null);
    });
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
    if(this.marker_) {
        this.marker_.setMap(null);
        delete this.marker_;
    }
}

Marker.prototype.createIcon = function() {
    // console.info('Marker.createImages');
    var iconUrl = this.get('iconUrl');
    // var hoverIconUrl = this.get('hoverIconUrl');

    var anchor = new google.maps.Point(24,24);
    this.markerImage_ = new google.maps.MarkerImage(iconUrl, null, null, anchor, null);
    // this.markerImageHover_ = new google.maps.MarkerImage(hoverIconUrl, null, null, anchor, null);
}

Marker.prototype.createHoverIcon = function() {
    var hoverIconUrl = this.get('hoverIconUrl');

    var anchor = new google.maps.Point(24,24);
    this.markerImageHover_ = new google.maps.MarkerImage(hoverIconUrl, null, null, anchor, null);
}
