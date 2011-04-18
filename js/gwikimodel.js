/* 
    States:
    1: Hidden
    2: Marker shown
    3: Marker hover
    4: Clicked


    editState
    0: Creating cancelled, delete model
    1: New, without name and type, only position set
    2: New with name/type set
    --- Only new model can be in above states and should never be save ---
    3: Metadata edited
    4: Server synced -- No content
    5: Server synced -- Server has same values
*/

 

function Gwikimodel() {
    this.marker_ = null;
    this.dialog_ = null;
    this.overlayHandler_ = null;

    google.maps.event.addListener(this, 'name_changed', function() {
        gwikiManager.add(this);
        this.set('contentUrl', wikiUrl+this.get('name')+'/text');
        this.set('contentEditUrl', wikiUrl+this.get('name')+'/text?action=edit');

    });

    google.maps.event.addListener(this, 'icon_changed', function() {
        var icon = this.get('icon');
        if(icon) {
            this.set('iconUrl', '/imgs/symbols/'+this.get('type')+'/'+icon);
            this.set('hoverIconUrl', '/imgs/symbols/'+this.get('type')+'/'+icon.replace('_def.', '_hover.'));
        }
        else {
            this.set('iconUrl', null);
            this.set('hoverIconUrl', null);
        }
    });

    google.maps.event.addListener(this, 'overlayimage_changed', function() {
        this.set('overlayImageUrl', wikiUrl + 'CloudImages?action=AttachFile&do=get&target='+this.get('overlayImage'));
    });

    google.maps.event.addListener(this, 'overlayimages_changed', function() {
        var urls = new google.maps.MVCArray();
        var images = this.get( 'overlayImages' );
        images.forEach(function(img, i) {
            urls.push(
                wikiUrl + 'CloudImages?action=AttachFile&do=get&target=' + img
            );
        });
        this.set( 'overlayImageUrls', urls );
    });

    google.maps.event.addListener(this, 'type_changed', function() {
        var cls = '';
        switch(this.get('type')) {
            case 'Tapahtuma':
                cls = 'tapahtuma';
            break;
            case 'Paikka':
                cls = 'paikka';
            break;
            case 'Tehtävä':
                cls = 'tehtava';
            break;
            case 'Ryhmä':
                cls = 'ryhma';
            break;
        }
        this.set('class', cls);
        // console.info(this.get('class'));
    });

    this.set('iconUrl', 'imgs/node_placer.png');
    this.set('hoverIconUrl', 'imgs/node_placer.png');

    this.set('type', 'Tapahtuma');
    this.set('state', 1);
    this.set('position', null);
    this.set('bounds', new google.maps.MVCArray());
    this.set('categories', new google.maps.MVCArray());
    this.set('contact', '');
    this.set('address', '');
    this.set('date', '');
    this.set('map', map);
    this.set('editState', 1);

    // this.init();
}

Gwikimodel.prototype = new google.maps.MVCObject();


Gwikimodel.prototype.init = function(state) {
    if(state == undefined)
        state = 1;

    google.maps.event.addListener(this, 'state_changed', function(e) {
        // console.info(this.get('name') + ' -> ' + 'Gwikimodel.state_changed:' +this.get('state'));
    });

    google.maps.event.addListener(this, 'editstate_changed', function(e) {
        var editState = this.get('editState');
        // console.info('Gwikimodel.editState_changed: '+editState);
        switch(editState) {
            case 0:
                this.removeMarker();
                this.removeOverlays();
                gwikiManager.remove(this);
                menuManager.clearCreateNew();
            break;
            case 3:
                gwikiManager.save(this);
                // this.set('editState', 4);
                menuManager.clearCreateNew();
            break;
        }
    });



    this.createMarker();
    this.createOverlays();
    this.createDialog();
    this.set('state', state);


}

Gwikimodel.prototype.createMarker = function() {
    // TODO: Create marker only for specific types
               
    this.marker_ = new Marker(this.get('position'));
    this.marker_.bindTo('map', this);
    this.marker_.bindTo('state', this);
    this.marker_.bindTo('editState', this);
    this.marker_.bindTo('name', this);
    this.marker_.bindTo('iconUrl', this);
    this.marker_.bindTo('hoverIconUrl', this);
    this.marker_.bindTo('position', this);

    var me = this;

    // Not needed anymore because states (this, this.marker_) are bind together
    // google.maps.event.addListener(this.marker_, 'mouseover', function(e) {
    //     google.maps.event.trigger(me, 'mouseover', e)
    // });
    // google.maps.event.addListener(this.marker_, 'mouseout', function(e) {
    //     google.maps.event.trigger(me, 'mouseout', e)
    // });
    // google.maps.event.addListener(this.marker_, 'click', function(e) {
    //     google.maps.event.trigger(me, 'click', e)
    // });
}

Gwikimodel.prototype.removeMarker = function() {
    if(this.marker_) {
        this.marker_.remove();
        this.marker_ = null;
    }
}

Gwikimodel.prototype.createOverlays = function() {
    this.overlayHandler_ = new OverlayHandler();
    this.overlayHandler_.bindTo('map', this);
    this.overlayHandler_.bindTo('state', this);
    this.overlayHandler_.bindTo('name', this);
    this.overlayHandler_.bindTo('bounds', this);
    this.overlayHandler_.bindTo('overlayImageUrl', this);
    this.overlayHandler_.bindTo('overlayImageUrls', this);
    // console.info(this.get('overlayImageUrls'));
    this.overlayHandler_.init();
}

Gwikimodel.prototype.removeOverlays = function() {
    if(this.overlayHandler_) {
        this.overlayHandler_.remove();
        this.overlayHandler_ = null;
    }
}

Gwikimodel.prototype.createDialog = function() {
    // console.info('createDialog');

    this.dialog_ = new Dialog();
    this.dialog_.bindTo('name', this);
    this.dialog_.bindTo('position', this);
    this.dialog_.bindTo('type', this);
    this.dialog_.bindTo('class', this);
    this.dialog_.bindTo('contentUrl', this);
    this.dialog_.bindTo('contentEditUrl', this);
    this.dialog_.bindTo('editState', this);
    this.dialog_.bindTo('state', this);

    this.dialog_.bindTo('bounds', this);

    this.dialog_.bindTo('address', this);
    this.dialog_.bindTo('contact', this);
    this.dialog_.bindTo('date', this);

    this.dialog_.bindTo('icon', this);
    this.dialog_.bindTo('iconUrl', this);

    this.dialog_.bindTo('categories', this);

    this.dialog_.init();
    
}

// Gwikimodel.prototype.openContentDialog = function() {
//     // console.info('o: '+this.get('position'));
//     this.removeDialog();

//     var dialog = new ContentDialogOverlay();
//     // this.dialog_.bindTo('state', this);
//     // this.dialog_.bindTo('map', this);
//     dialog.bindTo('position', this);
//     dialog.bindTo('name', this);
//     dialog.bindTo('type', this);
//     dialog.bindTo('contentUrl', this);

//     dialog.init();

//     this.set('dialog', dialog);

//     dialog.setMap(this.get('map'));
// }

// Gwikimodel.prototype.openNewDialog = function() {
//     console.info('Gwikimode.openNewDialog');
//     this.removeDialog();

//     this.dialog_ = new EditDialogOverlay();
//     this.dialog_.bindTo('position', this);
//     this.dialog_.bindTo('name', this);
//     this.dialog_.bindTo('type', this);
//     this.dialog_.bindTo('editState', this);
//     // this.dialog_.bindTo('state', this);

//     this.dialog_.init();

//     this.dialog_.setMap(this.get('map'));
// }

Gwikimodel.prototype.removeDialog = function() {
    if(this.dialog_) {
        // console.info('Model.removeDialog: '+this.get('name'));
        this.dialog_.setMap(null);
        delete this.dialog_;
        this.dialog_ = null;
    }
}


// Gwikimodel.prototype.getOverlayImageUrlPrefix = function() {
//     return wikiUrl + 'CloudImages?action=AttachFile&do=get&target=';
// }
// Gwikimodel.prototype.getOverlayImageUrl = function() {
//     return this.getOverlayImageUrlPrefix() + this.getOverlayImage();
// }
// Gwikimodel.prototype.fetchAvailableOverlayImages = function(callbackOnEach) {
//     $.get(wikiUrl+'CloudImages', {'action':'listattachments'}, function(data) {
//         if(callbackOnEach && data.names) {
//             for(var i in data.names){
//                 callbackOnEach(data.names[i]);
//             }
//         }
//     });
// }





// Gwikimodel.prototype.save = function(callbackOnSuccess, callbackOnFail) {
//     if(this.mapObject_) {
//         // Get new coords and bounds
//         this.setLatLng(this.mapObject_.getLatLng());
//         this.setBounds(this.mapObject_.getBounds());
//         this.mapObject_.setEditMode(false);
//     }
//     else {
//         this.setLatLng(null);
//         this.setBoudns(null);
//     }

//     this.data_.Gwikimodel = ['yes'];
    
//     var data = {
//         'action': 'setMetaJSON',
//         'args': '{"'+this.getName()+'":'+JSON.stringify(this.data_)+'}'
//     };
    
//     $.post(wikiUrl, data, function(data) {
//         if(data.status) {
//             if(callbackOnSuccess != undefined)
//                 callbackOnSuccess(data);
//         }
//         else {
//             // Storing values failed
//             if(callbackOnFail != undefined)
//                 callbackOnFail(data);

//         }
//     }, 'json');
// }


// Gwikimodel.prototype.addCategory = function(name) {
//     name = parseCategory(name);
//     if(name) {
//         if(this.data_.gwikicategory == undefined)
//             this.data_.gwikicategory = [];
//         this.data_.gwikicategory.push('Category'+name);
//         return name;
//     }
// }
// Gwikimodel.prototype.removeCategory = function(name) {
//     name = parseCategory(name);
//     if(this.data_.gwikicategory) {
//         var d = [];
//         for(var i in this.data_.gwikicategory) {
//             if(this.data_.gwikicategory[i] != name)
//                 this.data_.push(this.data_.gwikicategory[i]);
//         }
//         this.data_.gwikicategory = d;
//     }
// }


Gwikimodel.prototype.show = function() {
    this.set('state', 2);
}
Gwikimodel.prototype.hide = function() {
    this.set('state', 1);
}


// Gwikimodel.prototype.setHighlight = function(mode) {
//     if(this.mapObject_)
//         this.mapObject_.setHighlight(mode);
//     menuManager.setHighlight(mode, this.getName());
// }





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
