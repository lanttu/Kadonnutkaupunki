function ImageOverlayMap(imageName, opacity) {
    // this.imageUrl_ = imageUrl;
    this.setImage(imageName);
    // this.opacity_ = opacity;
    this.setOpacity(opacity);
}

ImageOverlayMap.prototype.tileSize = new google.maps.Size(1024,1024);

ImageOverlayMap.prototype.getTile = function(coord, zoom, ownerDocument) {
    var div = ownerDocument.createElement('DIV');
    div.style.width = this.tileSize.width + 'px';
    div.style.height = this.tileSize.height + 'px';
    

    
    // Top left corner of the tile
    var pointX = coord.x/Math.pow(2,zoom)*256;
    var pointY = coord.y/Math.pow(2,zoom)*256;

    // div.style.opacity = this.opacity_;
    $(div).fadeTo(0, this.opacity_);
    if(this.imageUrl_)
        div.style.backgroundImage = 'url('+this.imageUrl_+')';
    return div;
}

ImageOverlayMap.prototype.setOpacity = function(opacity) {
    this.opacity_ = opacity;
}

ImageOverlayMap.prototype.setImage = function(imageName) {
    if(!imageName)
        this.imageUrl_ = '';
    else {
        var url = wikiUrl + 'ImageOverlayImages?action=AttachFile&do=get&target=' + imageName;
        this.imageUrl_ = url;
    }
}

ImageOverlayMap.prototype.setOpacity = function(opacity) {
    opacity = parseFloat(opacity);
    if(opacity >= 0 && opacity <= 1)
        this.opacity_ = opacity;
    else
        this.opacity_ = 0.5;
}