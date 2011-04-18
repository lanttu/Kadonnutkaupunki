function ImageOverlay(bounds, imageUrl) {

    this.set( 'bounds', bounds );
    this.set( 'overlayImageUrl', imageUrl );
    // this.imageUrl_  = imageUrl;
    // this.title_     = title;

    // Manipulators for editing
    this.manipulatorBotLeft_    = null;
    this.manipulatorTopRight_   = null;
    this.manipulatorMove_       = null;
    this.manipulatorDel_        = null;
    
    // this.highlight_ = false;
    this.editMode_  = false;
        
    this.div_ = null;
    this.img_ = null;
    // this.setMap(map);
}


ImageOverlay.prototype = new google.maps.OverlayView();


ImageOverlay.prototype.onAdd = function() {

    var div = document.createElement('DIV');
    div.style.border = 'none';
    div.style.borderWidth = "0px";
    div.style.position = "absolute";
    // div.style.opacity = 0.5;
    div.style.zIndex = 9999;
    

    var img = document.createElement('img');
    img.src = this.get('overlayImageUrl');
    
    img.style.width = '100%';
    img.style.height = '100%';
    img.title = this.get('name');
    
    div.appendChild(img);
    
    this.div_ = div;
    this.img_ = img;
    
    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);

    if(!this.get('bounds') || this.get('bounds') == 'NEW') {
        // No bounds
        var proj = this.getProjection();

        var img = new Image();
        img.src = this.get('overlayImageUrl');

        var cPoint = proj.fromLatLngToDivPixel(map.getCenter());

        var swPoint = new google.maps.Point(cPoint.x-img.width/2, cPoint.y+img.height/2);
        var nePoint = new google.maps.Point(cPoint.x+img.width/2, cPoint.y-img.height/2);

        var sw = proj.fromDivPixelToLatLng(swPoint);
        var ne = proj.fromDivPixelToLatLng(nePoint);

        this.set('bounds', new google.maps.LatLngBounds(sw, ne));
    }
    // console.info(this.get('bounds'));
    
}


ImageOverlay.prototype.draw = function() {
    if(!this.div_)
        return;
    
    var bounds = this.get('bounds');
    var overlayProjection = this.getProjection();
    
    var sw = overlayProjection.fromLatLngToDivPixel(bounds.getSouthWest());
    var ne = overlayProjection.fromLatLngToDivPixel(bounds.getNorthEast());
    
    var div = this.div_;
    div.style.left = sw.x + 'px';
    div.style.top = ne.y + 'px';
    div.style.width = (ne.x - sw.x) + 'px';
    div.style.height = (sw.y - ne.y) + 'px';
}

ImageOverlay.prototype.onRemove = function() {
    this.removeManipulators();
    google.maps.event.clearInstanceListeners(this.div_);
    this.unbindAll();
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
    this.img_ = null;
}

// ImageOverlay.prototype.getBounds = function() {
//     return this.bounds_;
// }
// ImageOverlay.prototype.setBounds = function(bounds) {
//     this.bounds_ = bounds;
//     google.maps.event.trigger(this, 'bounds_changed', this.bounds);
//     this.draw();
// }

// ImageOverlay.prototype.getUrl = function() {
//     return this.imageUrl_;
// }


ImageOverlay.prototype.setSouthWest = function(latLng) {
    var bounds = new google.maps.LatLngBounds(latLng, this.getBounds().getNorthEast());
    this.setBounds(bounds);
}
ImageOverlay.prototype.setNorthEast = function(latLng) {
    var bounds = new google.maps.LatLngBounds(this.getBounds().getSouthWest(), latLng);
    this.setBounds(bounds);
}

ImageOverlay.prototype.setImage = function(url) {
    this.imageUrl_ = url;
    google.maps.event.trigger(this, 'image_changed', this.imageUrl_);
    if(this.img_) {
        this.img_.src = url;
    }
}

// ImageOverlay.prototype.setOpacity = function(opacity) {
//     this.opacity_ = opacity;
//     if(this.div_)
//         this.div_.style.opacity = opacity;
// }


ImageOverlay.prototype.setEdit = function(mode) {
    if(mode) {
        this.createManipulators();
    }
    else {
        this.removeManipulators();
    }
}

ImageOverlay.prototype.removeManipulators = function() {
    if(this.manipulatorMove_) {
        this.manipulatorMove_.setMap(null);
        delete this.manipulatorMove_;
        this.manipulatorMove_ = null;
    }
    if(this.manipulatorBotLeft_) {
        this.manipulatorBotLeft_.setMap(null);
        delete this.manipulatorBotLeft_;
        this.manipulatorBotLeft_ = null;
    }
    if(this.manipulatorTopRight_) {
        this.manipulatorTopRight_.setMap(null);
        delete this.manipulatorTopRight_;
        this.manipulatorTopRight_ = null;
    }
    if(this.manipulatorDel_) {
        this.manipulatorDel_.setMap(null);
        delete this.manipulatorDel_;
        this.manipulatorDel_ = null;
    }
}

ImageOverlay.prototype.createManipulators = function() {
    this.removeManipulators();

    var me = this;


    this.manipulatorBotLeft_ = new Manipulator('botLeft', '/kk/imgs/manipulator_botleft.png', this, null, function(latLng) {
        me.setSouthWest(latLng);
    });

    this.manipulatorTopRight_ = new Manipulator('topRight', '/kk/imgs/manipulator_topright.png', this, null, function(latLng) {
        me.setNorthEast(latLng);
    });

    this.manipulatorMove_ = new Manipulator('center', '/kk/imgs/manipulator_center.png', this, null, function(latLng) {
        var bounds = me.getBounds();
        var center = bounds.getCenter();
        var deltaLat = latLng.lat() - center.lat();
        var deltaLng = latLng.lng() - center.lng();
        
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        
        var newSw = new google.maps.LatLng(sw.lat()+deltaLat, sw.lng()+deltaLng);
        var newNe = new google.maps.LatLng(ne.lat()+deltaLat, ne.lng()+deltaLng);
        
        var newBounds = new google.maps.LatLngBounds(newSw, newNe);
        me.setBounds(newBounds);
    });

    this.manipulatorDel_ = new Manipulator('topLeft', '/kk/imgs/manipulator_center.png', this, function() {
        gwikiManager.exec(me.get('name'), function() {
            this.mapObject_.removeImageOverlay(me);
        });
    });

}


// Helper function for disabling event propagation
function cancelEvent(e) { 
  e.cancelBubble = true; 
  if (e.stopPropagation) e.stopPropagation(); 
} 




function Manipulator(pos, img, parent, onClick, onDragend) {
    this.div_ = null;
    this.img_ = img;
    this.pos_ = pos;
    this.parent_ = parent;
    this.onClick_ = onClick;
    this.onDragend_ = onDragend;

    this.size_ = 24;
    this.setMap(map);
}

Manipulator.prototype = new google.maps.OverlayView();

Manipulator.prototype.onAdd = function() {
    var div = document.createElement('DIV');

    div.style.border = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'absolute';
    div.style.zIndex = '99999';
    div.style.height = this.size_+'px';
    div.style.width = this.size_+'px';
    div.style.background = 'url('+this.img_+') 0 0 no-repeat';
    div.style.cursor = 'pointer';

    this.div_ = div;
    
    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);

    var me = this;
    google.maps.event.addListener(this.parent_, 'bounds_changed', function() {
        me.draw();
    });


    if(this.onClick_) {
        $(div).click(this.onClick_);
    }

    if(this.onDragend_) {
        $(div).draggable(); // Make div draggable

        $(div).bind('dragstop', function() {
            var x = parseInt(this.style.left.slice(0,-2));
            var y = parseInt(this.style.top.slice(0,-2));
            switch(me.pos_) {
                case 'botLeft':
                    y += me.size_;
                break;
                case 'topRight':
                    x += me.size_;
                break;
                case 'center':
                    x += me.size_/2;
                    y += me.size_/2;
                break;
                case 'topLeft':
                    //
                break;
                default:
                    // console.info('Unknown type: '+me.pos_);
                break;
            }
            var point = new google.maps.Point(x,y);
            var latLng = me.getProjection().fromDivPixelToLatLng(point);
            me.onDragend_(latLng);
        });
    }

    google.maps.event.addDomListener(div, 'mousedown', cancelEvent);
    google.maps.event.addDomListener(div, 'click', cancelEvent);
    google.maps.event.addDomListener(div, 'dblclick', cancelEvent);
    google.maps.event.addDomListener(div, 'contextmenu', cancelEvent); 
}


Manipulator.prototype.onRemove = function() {
    google.maps.event.clearInstanceListeners(this.div_);
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
}



Manipulator.prototype.draw = function() {
    if(!this.div_)
        return
    
    var div = this.div_;
    var pos = this.pos_;

    var pro = this.getProjection();

    switch(pos) {
        case 'botLeft':
            var sw = pro.fromLatLngToDivPixel(this.parent_.getBounds().getSouthWest());
            div.style.top = sw.y-this.size_+'px';
            div.style.left = sw.x+'px';
        break;
        case 'topRight':
            var ne = pro.fromLatLngToDivPixel(this.parent_.getBounds().getNorthEast());
            div.style.top = ne.y+'px';
            div.style.left = ne.x-this.size_+'px';
        break;
        case 'center':
            var center = pro.fromLatLngToDivPixel(this.parent_.getBounds().getCenter());
            div.style.top = center.y-this.size_/2+'px';
            div.style.left = center.x-this.size_/2+'px';
        break;
        case 'topLeft':
            var sw = pro.fromLatLngToDivPixel(this.parent_.getBounds().getSouthWest());
            var ne = pro.fromLatLngToDivPixel(this.parent_.getBounds().getNorthEast());
            div.style.top = ne.y+'px';
            div.style.left = sw.x+'px';
        break;
        default:
            // console.info('Unknown pos type: '+pos);
        break;
    }


}
