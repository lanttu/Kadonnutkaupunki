function ModelCreator() {
    this.div_ = $( '<div> ').appendTo ('body' );
    this.model_ = null;
    this.newModel_ = false;
}

ModelCreator.prototype.createNew = function(model) {
    // console.info ( 'ModelCreator.createNew' );
    this.model_ = model;
    this.newModel_ = true;
    this.selectType();
}

ModelCreator.prototype.closeDialog = function() {
    if ( this.div_.dialog( 'isOpen') ) {
        this.div_.dialog( 'close' );
        this.div_.dialog( 'destroy' );
    }
}

ModelCreator.prototype.selectType = function() {
    this.closeDialog();

    var div = this.div_;
    var me = this;
    var selectedType = null;

    div.load( 'pageparts/select_type.html', function() {

        div.dialog({
            height: 200,
            width: 400,
            title: 'Valitse luotavan kohteen tyyppi',
            close: function() {
                // console.info(selectedType);
                if ( selectedType === null ) {
                    me.cancel();
                } else {
                    if(selectedType == 'Tapahtuma' 
                        || selectedType == 'Paikka') {

                        me.pickPosition();
                    }
                    else {
                        me.setMetadata();
                    }
                    
                }
            }
        });
        
        // Styling
        $( '#typeset', div ).buttonset();
        $( '#submit-page', div ).button();

        $( '#submit-page', div ).click( function() {
            // console.info(me);
            selectedType = $( 'input[name="type"]:checked', div ).val();
            me.model_.set( 'type', selectedType );
            me.closeDialog();
        });
    });
}

ModelCreator.prototype.pickPosition = function() {
    this.closeDialog();

    menuManager.setCrosshairMode( true );

    var div = this.div_;
    var me = this;
    var pickedPosition = null;

    div.load('pageparts/click_map.html', function() {
        div.dialog({
            height: 100,
            width: 200,
            position:'top',
            close: function() {
                menuManager.setCrosshairMode( false );
                if ( pickedPosition === null ) {
                    me.cancel();
                } else {
                    me.setMetadata();
                }
            }
        });
        google.maps.event.addListenerOnce( map, 'click', function(e) {
            
            pickedPosition = e.latLng;
            me.model_.set('position', pickedPosition);
            me.closeDialog();

        });
    });
}

ModelCreator.prototype.setMetadata = function() {
    this.closeDialog();

    this.model_.set( 'state', 2 );

    var type = this.model_.get( 'type' );
    var cls = this.model_.get( 'class' );
    var finished = false;
    var iconRequired;

    iconUrlPrefix = '/imgs/symbols/' + type + '/';
    listIconsUrl = '/imgs/symbols/' + type + '/list.xml';


    var div = this.div_;
    var me = this;

    div.load( 'pageparts/metaedit.html', function() {

        // Show name only if creating new
        if ( !me.newModel_ ) {
            $( '.name', this ).hide();
        } else {
            // Check name availability
            $( '#page-name' ).keyup($.debounce(function() {
                var pageName = $( this ).val();
                if ( pageName != '' ) {
                    $.ajax({
                        url: wikiUrl + pageName,
                        data:{},
                        success: function(data, status, request) {
                            $( '#page-name-error', div )
                                .html( 'Nimi on jo olemassa' );
                            $( '#page-name', div ).addClass( 'error' );
                            $( '#submit-edit', div )
                                .button( 'option', 'disabled', true );
                        },
                        error: function(request, status, error) {
                            if(request.status == 404) {
                                $( '#page-name-error', div ).html( '' );
                                $( '#page-name', div ).removeClass( 'error' );
                                $( '#submit-edit', div )
                                    .button( 'option', 'disabled', false );
                            }
                        }
                    });
                }
                else {
                    $( '#submit-edit', div )
                        .button( 'option', 'disabled', true );
                    $( '#page-name', div ).addClass( 'error' );
                    $( '#page-name-error', div ).html( 'Sivun nimi puuttuu' );
                }
            }, 300));
        }

        if ( type != 'Tapahtuma' && type != 'Paikka' ) {
            // Hide icon fields
            $( '.icon', this ).hide();
            iconRequired = false;
        } else {
            iconRequired = true;
            var iconsDiv = $( '#icons', this );
            var selectedImg = $( '#icon', this );

            $.ajax({
                url: listIconsUrl,
                dataType: 'xml',
                success: function(data) {
                    $(data).find( 'symbol' ).each(function() {
                        var icon = $(this).text();
                        $( '<img src="' + iconUrlPrefix + icon 
                            + '" value="' + icon + '"/>').click(function() {

                            var src = $( this ).attr( 'src' );
                            var icon = $(this).attr( 'value' );
                            selectedImg.attr( 'src', src );
                            selectedImg.attr( 'value', icon );
                            me.model_.set( 'icon', $('#icon').attr('value') );
                        }).appendTo(iconsDiv);                    
                    });
                }
            });
        }

        me.model_.get( 'categories' ).forEach( function(b,i) {
            $( '#categories', this )
                .append('<li><span>' + b + '</span> '
                    + '<a class="remove-category" href="">Poista</a></li>');
        });

        $( '#submit-edit', this ).button();
        $( '#add-category', this ).button();

        // Add category
        $( '#add-category', this ).click(function() {
            var val = $('#new-category').val();
            var categoryName = parseCategory(val);
            if(categoryName) {
                $('<li><span>'+ categoryName + '</span> <a class="remove-category" href="">Poista</a></li>').appendTo( '#categories' ).children('a').each(function() {
                    $(this).click(function() {
                        $(this).parent().remove();
                        return false;
                    });
                });
                $('#new-category').val('');
            }
        });
        // Remove category
        $( '#categories > li > a', this ).each(function() {
            $( this ).click(function() {
                $( this ).parent().remove();
                return false;
            });
        });

        $( '#submit-edit', this ).click(function() {

            if( iconRequired 
                && $( '#icon', div ).attr( 'value' ) == 'undefined' ) {

                $( '#icon-error', div ).text( 'Kuvaketta ei valittu' );
                return false;
            }

            if ( me.newModel_ ) {
                if($( '#page-name', div ).val() == '' ) {
                    $( '#page-name-error', div )
                        .text( 'Tapahtumalla ei ole nimeä' );
                    return false;
                }
                me.model_.set( 'name', $( '#page-name', div ).val() );
            }

            me.model_.set( 'date', $( '#date', div ).val() );

            var categories = new google.maps.MVCArray();
            $( '#categories > li > span', div ).each( function() {
                categories.push( $(this).text() );
            });
            me.model_.set( 'categories', categories );
            me.model_.set( 'icon', $('#icon').attr('value') );

            finished = true;

            me.closeDialog();
            return false;
        });

        div.dialog({
            height: 400,
            width: 400,
            position: 'top',
            // position: [this.get('x'), this.get('y')],
            title: type,
            close: function() {
                // div.parents('.ui-dialog:eq(0)').unwrap(); // Remove wrapper, see below

                if ( finished ) {
                    me.save( true );
                    // me.editContent();
                } else {
                    me.cancel();
                }

            }
        });//.parents('.ui-dialog:eq(0)').wrap('<div class="' + cls + '"/>');
        
    });

}

ModelCreator.prototype.save = function( editContent ) {
    var me = this;
    if ( editContent ) {
        gwikiManager.save( this.model_, function() {
            me.editContent();
        });
    }
}

ModelCreator.prototype.editContent = function() {

    this.closeDialog();

    var me = this;
    var div = this.div_;

    div.load( 'pageparts/contentedit.html', function() {

        var textarea = $( "#content", div ).tinymce({
            script_url : 'tinymce/jscripts/tiny_mce/tiny_mce.js',
            theme: 'simple'
        });
        var urlPrefix = wikiUrl + me.model_.get( "name" ) + "/";
        $( "#language" ).change(function() {
            textarea.attr( "disabled", "disabled" );
            $.ajax({
                url: urlPrefix + $( this ).val(),
                data: { action: "format", mimetype: "html" },
                success: function( data ) {
                    textarea.val( data );
                },
                error: function() {
                    textarea.val( "" );
                },
                complete: function() {
                    textarea.attr( "disabled", "0" );
                }
            });
        });

        $( "#save", div ).click(function() {
            var content = $( "#content", div ).val();
            
            // console.info( content );
            $.post(
                wikiUrl + me.model_.get( "name" ) + "/" + $("#language").val(),
                {
                    action: 'edit',
                    savetext: content,
                    editor: 'gui',
                    format: 'wiki'
                },
                function (data) {
                    // console.info(data);
                }
            );
        });
        
        div.dialog({
            height: 600,
            width: 800,
            // position: [this.get('x'), this.get('y')],
            title: me.model_.get( 'name' ),
            dialogClass: me.model_.get( 'class' )
        });
    });
   
}


ModelCreator.prototype.cancel = function() {
    menuManager.clearCreateNew();
    this.model_.removeMarker();
    this.model_.removeOverlays();
    delete this.model_;
    this.model_ = null;
}