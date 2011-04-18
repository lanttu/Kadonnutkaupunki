function OverlayHandler() {
    this.overlays_ = new google.maps.MVCArray();
}

OverlayHandler.prototype = new google.maps.MVCObject();

OverlayHandler.prototype.init = function() {
    // console.info('OverlayHandler.init');
    var bounds = this.get('bounds');
    var imageUrls = this.get( 'overlayImageUrls' );
    var me = this;

    google.maps.event.addListener(this.get('bounds'), 'insert_at', function(i) {
        console.info('bounds.insert_at')
        var o = new ImageOverlay(this.getAt(i));
        me.overlays_.push(o);
    });

    // google.maps.event.addListener(this, 'bounds_changed', function() {
    //     console.info('BOUNDS CHANGED');
    // });
    
    var imageIndex = 0;

    bounds.forEach(function(b,i) {
        var o = new ImageOverlay(b, imageUrls.getAt(imageIndex) );
        o.bindTo('name', me);
        // o.bindTo('overlayImageUrl', me);
        // o.bindTo(i, bounds, 'bounds');
        me.overlays_.push(o);
        imageIndex++;
        if ( imageIndex >= imageUrls.getLength() ) {
            imageIndex = 0;
        }

    });


    google.maps.event.addListener(this, 'state_changed', function() {
        var state = this.get('state');
        // console.info(this.get('name') + ' -> OverlayHandler.state_changed: '+state);
        if(state >= 2)
            this.show();
        else
            this.hide();
    });
}

OverlayHandler.prototype.show = function() {
    var me = this;
    this.overlays_.forEach(function(o, i) {
        if(!o.getMap())
            o.setMap(me.get('map'));
    });
}

OverlayHandler.prototype.hide = function() {
    var me = this;
    this.overlays_.forEach(function(o, i) {
        o.setMap(null);
    });
}

OverlayHandler.prototype.remove = function() {
    this.hide();
    this.unbindAll();

}

// OverlayHandler.prototype.getOverlayImageUrlPrefix = function() {
//     return wikiUrl + 'CloudImages?action=AttachFile&do=get&target=';
// }
// OverlayHandler.prototype.getOverlayImageUrl = function() {
//     return this.getOverlayImageUrlPrefix() + this.get('overlayImage');
// }



// OverlayHandler.prototype.fetchAvailableOverlayImages = function(callbackOnEach) {
//     $.get(wikiUrl+'CloudImages', {'action':'listattachments'}, function(data) {
//         if(callbackOnEach && data.names) {
//             for(var i in data.names){
//                 callbackOnEach(data.names[i]);
//             }
//         }
//     });
// }