function ColorOverlayMap(color, opacity) {
    this.color_ = color;
    this.opacity_ = opacity;
}

ColorOverlayMap.prototype.tileSize = new google.maps.Size(1024,1024);

ColorOverlayMap.prototype.getTile = function(coord, zoom, ownerDocument) {
    var div = ownerDocument.createElement('DIV');
    div.style.width = this.tileSize.width + 'px';
    div.style.height = this.tileSize.height + 'px';
    

    
    // Top left corner of the tile
    var pointX = coord.x/Math.pow(2,zoom)*256;
    var pointY = coord.y/Math.pow(2,zoom)*256;
    // div.style.opacity = this.opacity_;
    $(div).fadeTo(0, this.opacity_); // This works also in IE
    div.style.backgroundColor = this.color_;
    return div;
}

ColorOverlayMap.prototype.set = function(color, opacity) {
    this.color_ = color;
    this.opacity_ = opacity;
}