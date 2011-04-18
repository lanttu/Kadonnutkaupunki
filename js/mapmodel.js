function MapModel(page, func) {
    var me = this;
    $.get(wikiUrl+page, {'action':'getMetaJSON', 'args':page}, function(response){
        if(response[page]){
            var data = response[page];

            if(data.gwikicoordinates && data.gwikicoordinates[0])
                me.set('position',coordsToLatLng(data.gwikicoordinates[0]));
            else
                me.set('position', null);

            if(data.mapstyle && data.mapstyle[0])
                me.set('style', data.mapstyle[0]);
            else
                me.set('style', 'default');

            if(data.tiledoverlay && data.tiledoverlay[0])
                me.set('tiledOverlay', data.tiledoverlay[0]);
            else
                me.set('tiledOverlay', 'default.png');

            if(data.tiledoverlayopacity && data.tiledoverlayopacity[0])
                me.set('tiledOverlayOpacity',this.data_.tiledoverlayopacity[0]);
            else
                me.set('tiledOverlayOpacity', '0.5');

            if(data.coloroverlay && data.coloroverlay[0])
                me.set('colorOverlay', this.data_.coloroverlay[0]);
            else
                me.set('colorOverlay', '#FFFFFF');

            if(data.coloroverlayopacity && data.coloroverlayopacity[0])
                me.set('colorOverlayOpacity', this.data_.coloroverlayopacity[0]);
            else
                me.set('colorOverlayOpacity', '0.0');

            if(data.loadcategory)
                me.set('loadCategories', data.loadcategory);
            else
                me.set('loadCategories', []);

            if(func)
                func.apply(me);
        }
    });
}

MapModel.prototype = new google.maps.MVCObject();
