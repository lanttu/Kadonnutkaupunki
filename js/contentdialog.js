function ContentDialog(title, name, cls) {
    this.title_ = title;
    this.name_ = name;
    this.visible_ = false;
    this.contentUrlSet_ = false;
    
    this.class_ = cls
    this.div_ = null;
    this.setMap(map);


    var self = this;
    // Define content url
    $.ajax({
        url: encodeURI( wikiUrl + name + '/' + lang ),
        success: function() {
            self.setContentUrl( wikiUrl + name + '/' + lang );
        },
        error: function( request, textStatus, error ) {
            $.ajax({
                url: wikiUrl + name + '/text',
                success: function() {
                    self.setContentUrl( wikiUrl + name + '/text' );
                },
                error: function() {
                    self.setContentUrl( false );
                }
            });
        }
    });
    
    google.maps.event.addListener(this, 'state_changed', function() {
        var state = this.get('state');
        switch(state) {
            case 3:
                this.visible_ = false;
                this.clearDiv();
                break;
            case 4:
                this.visible_ = true;
                this.showContent();
                break;
        }
    });

    // google.maps.event.addListener(this, 'position_changed', function() {
    //     var proj = this.getProjection();
    //     if(proj) {
    //         var latLng = this.get('position');
    //         var pos = proj.fromLatLngToContainerPixel(latLng);

    //         this.set('x', pos.x + 30);
    //         this.set('y', pos.y + 30);
    //     }
    // });
}

ContentDialog.prototype = new google.maps.OverlayView();

ContentDialog.prototype.setContentUrl = function( url ) {
    if ( url ) {
        this.contentUrl_ = encodeURI( url );
        // this.contentUrl_ = url;
    } else {
        this.contentUrl_ = '';
    }

    this.contentUrlSet_ = true;
    if ( this.visible_ ) {
        this.showContent();
    }
}

ContentDialog.prototype.draw  = function() {
    // console.info('Dialog.draw');
    var proj = this.getProjection();
    var latLng = this.get('position');
    if ( latLng ) {
        var pos = proj.fromLatLngToContainerPixel(latLng);

        this.set( 'x', pos.x + 30 );
        this.set( 'y', pos.y + 30 );
    }
}

ContentDialog.prototype.isOpen = function() {
    if(this.div_)
        return true;
    else
        return false;
}

ContentDialog.prototype.clearDiv = function() {
    if(this.div_) {
        this.div_.dialog('remove');
        this.div_.html('');
        this.div_.remove();
        this.div_ = null;
    }
}

ContentDialog.prototype.showContent = function() {
    if ( !this.contentUrlSet_ ) {
        return;
    }
    this.clearDiv();

    var div = $('<div><iframe src="' 
        + this.contentUrl_ + '" style="background-color:transparent;" \
        allowtransparency="true" \
        width="780" height="550" \
        marginwidth="0" marginheight="0" frameborder="0" /></div>')
        .appendTo('body');
    this.div_ = div;
    console.info(this.contentUrl_);

    var me = this;
    
    div.dialog({
        height: 600,
        width: 800,
        overflow: "hidden",
        position: [this.get('x'), this.get('y')],
        // dialogClass: this.get('class'),
        title: '<a class="iframe-back" href="">' + this.title_ + '</a>',
        open: function() {
            // This should force iframe to load right content
            var iframe = div.find('iframe').get();
            iframe.src = iframe.src;
        },
        close: function() {
            if ( me.get('state') > 2 ) {
                me.set('state', 2);
            }
            div.parents('.ui-dialog:eq(0)').unwrap(); // Remove wrapper, see below
            div.remove(); 
    
        }
    }).parents('.ui-dialog:eq(0)').wrap('<div class="' + this.class_ + '"/>'); // Adds specific theme


    $(div).parent().find('.iframe-back').click(function() {
        div.find('iframe').attr('src', this.contentUrl_);
        return false;
    });

}
