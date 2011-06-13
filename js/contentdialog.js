function ContentDialog(name, cls) {
    // this.title_ = title;
    this.name_ = name;
    this.visible_ = false;
    this.contentUrlSet_ = false;
    
    this.class_ = cls
    this.div_ = null;


    var self = this;
    // Define content url
    $.ajax({
        url: encodeURI( wikiUrl + name + '/' + lang ),
        success: function() {
            self.setContentPage( name + "/" + lang );
        },
        error: function( request, textStatus, error ) {
            $.ajax({
                url: wikiUrl + name + "/text",
                success: function() {
                    self.setContentPage( name + "/text" );
                },
                error: function() {
                    self.setContentPage( false );
                }
            });
        }
    });
    
    google.maps.event.addListener(this, 'state_changed', function() {
        var state = this.get('state');
        if ( state > 3 ) {
            this.showDialog();
        } else {
            this.visible_ = false;
        }
    });
}

ContentDialog.prototype = new google.maps.MVCObject();

ContentDialog.prototype.setContentPage = function( contentPage ) {
    if ( contentPage ) {
        this.contentPage_ = contentPage;
    } else {
        this.contentPage_ = 'NotFound';
    }

    this.contentPageSet_ = true;
    this.showDialog();
}

ContentDialog.prototype.showDialog = function() {
    if ( !this.contentPageSet_ ) {
        return;
    }
    if ( !this.visible_ ) {
        var self = this;
        $.kkDialog( this.contentPage_, {
            title: this.get( "title" ),
            width: 780,
            height: 550,
            close: function() {
                if ( self.get( "state") > 2 ) {
                    self.set( "state", 2 );
                }
            }

        });
        this.visible_ = true;
    }

}

