function ContentDialog(name, cls) {
    this.name_ = name;
    this.visible_ = false;
    
    this.class_ = cls
    this.div_ = null;
    
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

ContentDialog.prototype.showDialog = function() {
    if ( !this.visible_ ) {
        var self = this;
        var name = this.name_;
        $.kkDialog( name, {
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

