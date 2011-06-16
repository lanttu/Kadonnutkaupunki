function MenuManager() {
    
    this.menuDiv_ = document.getElementById('menu');
    this.mainmenu_ = document.getElementById('mainmenu');
    this.zoom_ = document.getElementById('zoom');
    
    this.listener_ = null;

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.menuDiv_);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
        document.getElementById('turku-2011')
    );
    
    // Hide sub menus
    $(this.mainmenu_).find(' > li').hover(function() {
        $(this).children('ul').show();
    }, function() {
        $(this).children('ul').hide();
    });

    var activeOnLoad = [];

    // Type buttons
    var typesElement = $( "#types" );
    for ( var type in types ) {
        if ( type == "default" ) {
            continue;
        }
        $( "<li>" ).attr( "data-clickaction", "toggletype" )
            .attr( "data-attr", type )
            // .css( "backgroundColor", types[type].color )
            .appendTo( typesElement )
            .text( types[type].plural );
    }

    $( "li", typesElement ).mouseover(function() {
        var type = $( this ).data( "attr" );
        $( this ).css( "backgroundColor", types[type].color );
    }).mouseout(function() {
        if ( !$(this).hasClass("active") ) {
            $( this ).css( "backgroundColor", "" );
        }
    });

    // Path type buttons
    var pathTypesElement = $( "#path-types" );
    for ( var pathType in pathTypes ) {
        var li = $( "<li>" ).attr( "data-clickaction", "toggletype" )
            .attr( "data-attr", pathType )
            // .css( "backgroundColor", pathTypes[pathType].color )
            .appendTo( pathTypesElement )
            .text( pathTypes[pathType].plural );
        if ( pathTypes[pathType].active ) {
            activeOnLoad.push(li);
        }
    }

    $( "li", pathTypesElement ).mouseover(function() {
        var type = $( this ).data( "attr" );
        $( this ).css( "backgroundColor", pathTypes[type].color );
    }).mouseout(function() {
        if ( !$(this).hasClass("active") ) {
            $( this ).css( "backgroundColor", "" );
        }
    });

    this.mainmenuActions_ = $(this.menuDiv_).find('[data-clickaction]');

    var me = this;
    
    this.mainmenuActions_.click(function(e) {
        var actionType = $(this).attr('data-clickaction');
        var actionAttr = $(this).attr('data-attr');
        try {
            // Forms something like: me.loadGwikidata(this, attr)
            eval('me.'+actionType+'(this, actionAttr)');
        }
        catch(e) {
            logMessage( "Invalid menu action: " + e );
        }
        return false;
    });

    for ( var i in activeOnLoad ) {

        activeOnLoad[i].mouseover().click();
    }

 
    // $('#zoom-in').click(function() {
    //     var zoomLevel = map.getZoom();
    //     map.setZoom(zoomLevel+1);
    // });
    // $('#zoom-out').click(function() {
    //     var zoomLevel = map.getZoom();
    //     map.setZoom(zoomLevel-1);
    // });
    
    
}

MenuManager.prototype.updateLoginStatus = function() {
    if ( validUser ) {
        $(this.menuDiv_).find('[data-clickaction="login"]').hide();
            $(this.menuDiv_).find('[data-clickaction="logout"]').show();
        $(this.menuDiv_).find('#menu-profiili').show();
        $('#menu-luouusi').show();
    } else {
        $(this.menuDiv_).find('[data-clickaction="login"]').show();
        $(this.menuDiv_).find('[data-clickaction="logout"]').hide();
        $('#menu-luouusi').hide();
    }
}

MenuManager.prototype.clearActive = function(button) {
    var siblings = $(button).siblings();
    siblings.removeClass('active');
    if(this.listener_) {
        google.maps.event.removeListener(this.listener_);
        this.listener_ = null;
        this.setCrosshairMode(false);
    }
}



MenuManager.prototype.setCrosshairMode = function(mode) {
    if ( mode ) {
        var cursor = 'crosshair';
    } else {
        var cursror = 'hand';
    }
    map.setOptions({'draggableCursor':cursor});
}



/*
    Click Actions
*/

MenuManager.prototype.user = function(button, attr) {
    if ( $(button).hasClass('active') ) {
        return;
    }
    else if ( username == '' ) {
        showLogin();
        return; 
    }
    $(button).addClass('active');
    openPage(wikiUrl+username, null, function() {
        $(button).removeClass('active');
    }, 'Omat tiedot - '+username);

}

MenuManager.prototype.login = function(button, attr) {
    showLogin();
    return;

    openPage('login.html', function() {
        
        var dialog = this;
        $('#login').button();
        $('#login').click(function() {

            var username = $('#username').val();
            var password = $('#password').val();
            
            $.post(wikiUrl, {action: 'login', login: 'Kirjaudu sisään', name: username, password: password}, function(data, status) {
                whoAmI(function(success) {
                    if(success) {
                        dialog.remove();
                    }
                    else {
                        $('#login-error').text('Väärä käyttäjänimi tai salasana');
                    }
                });
            });
        });

        $('#create-account').click(function() {
            dialog.remove();
            openPage('newaccount.html', function() {
                var dialog = this;
                $('#createaccount').button(); // jquery ui styling
                $('#createaccount').click(function() {
                    var username = $('#username').val();
                    var pw = $('#password').val();
                    var email = $('#email').val();
                    var name = $('#name').val();
                    var title = $('#title').val();

                    $.post(wikiUrl, {action: 'kknewaccount', name: username, password: pw, email: email}, function(data) {
                        if(data == 'User account created! You can use this account to login now...') {
                            // Log in
                            $.post(wikiUrl, {action: 'login', login: 'Kirjaudu sisään', name: username, password: pw}, function(data, status) {
                                whoAmI(function(success) {
                                    if(success) {
                                        // Fill rest of the data and open editor
                                        $.get(wikiUrl, {action:'setMetaJSON', args: '{"'+username+'":'+JSON.stringify({'title':[title],'name':[name]})+'}'}, function(data) {
                                            if(data.status == 'ok') {
                                                dialog.html('<iframe style="width:100%; height:100%" src="'+wikiUrl+username+'/text?action=edit"></iframe>');
                                            }
                                        });
                                        // dialog.remove();
                                    }
                                    else {
                                        // $('#login-error').text('Väärä käyttäjänimi tai salasana');
                                    }
                                });
                            });
                            
                            // dialog.html('<p>Käyttäjätunnuksen luonti onnistui</p>');
                            // whoAmI();
                        }
                        else {
                            $('#createaccount-error').text(data);
                        }
                    });
                });
            }, null, 'Luo tunnus', 363, 400);
            return false;
        });

    }, function() {
        // onClosed
    }, 'Kirjaudu sisään', 363, 300);
}

MenuManager.prototype.logout = function(button, attr) {
    $.get(wikiUrl, {action: 'logout', logout: 'logout'}, function() {
        whoAmI();
    });
}

MenuManager.prototype.toggletype = function(button, attr) {
    if( !$(button).hasClass("executing") ) {
        $( button ).addClass( "executing" );

        if ( $(button).hasClass('active') ) {
            gwikiManager.hideType( attr, function() {
                $(button).removeClass( "executing" );
            });
        }
        else {
            gwikiManager.showType( attr, function(){
                $(button).removeClass( "executing" );
            });
        }
        $(button).toggleClass( "active" );
    }
}

MenuManager.prototype.toggle = function(button, attr) {
    var s = attr.split('|');
    console.info(attr);
    if($(button).hasClass('active')) {
        // $(button).removeClass('active');
        gwikiManager.hideCategory(s[0], s[1]);
    }
    else {
        gwikiManager.showCategory(s[0], s[1]);
    }
    // this.clearActive(button);
    $(button).toggleClass('active');
}

MenuManager.prototype.openPage = function(button, attr) {
    if ( $(button).hasClass("active") ) {
        return;
    }

    // var url = wikiUrl + attr;
    $( button ).addClass( "active" );
    $.kkDialog( attr, {
        width: $( button ).data( "width" ),
        height: $( button ).data( "height" ),
        cls: $( button ).data( "dialogclass" ),
        close: function() {
            $( button ).removeClass( "active" );
        }
    });
}

MenuManager.prototype.clearCreateNew = function() {
    $('[data-clickaction="createNew"]').removeClass('active');
}

MenuManager.prototype.createNew = function(button, attr) {
    if ( $( button ).hasClass( 'active' ) ) {
        return;
    }
    $( button ).addClass( 'active' );

    var newModel = new Gwikimodel();
    newModel.init();
    if ( !modelCreator ) {
        modelCreator = new ModelCreator();
    }
    modelCreator.createNew( newModel );
    // modelCreator.setModel( newModel );

    // g.init( 2 );
    // g.set( 'editState', 1 );

}

// MenuManager.prototype.editGwikidata = function(button, attr) {
//     var s = '<li data-clickaction="editContent" data-attr="'+attr+'">Muokkaa sisältöä</li><li data-clickaction="openEditor" data-attr="'+attr+'">Muokkaa</li><li data-clickaction="addOverlay" data-attr="'+attr+'">Lisää kuva</li><li data-clickaction="saveEdit" data-attr="'+attr+'">Tallenna</li><li data-clickaction="cancelEdit" data-attr="'+attr+'">Peruuta</li>'
//     // this.setSubmenu(s);
//     gwikiManager.exec(attr, function() {
//         this.show();
//         this.edit();
//     });
// }

MenuManager.prototype.addOverlay = function(button, attr) {
    gwikiManager.exec(attr, function() {
        if(this.mapObject_.createImageOverlay) {
            this.mapObject_.createImageOverlay();
        }
    });
}

MenuManager.prototype.loadGwikidata = function(button, attr) {
    gwikiManager.load(attr, function() {
        this.show();
    });
}

MenuManager.prototype.saveGwikidata = function(button, attr) {
    gwikiManager.exec(attr, function() {
        this.save();
    });
}

MenuManager.prototype.cancelEdit = function(button, attr) {
    this.clearActive();
    this.loadGwikidata(button, attr);
}

MenuManager.prototype.saveEdit = function(button, attr) {
    this.clearActive();
    this.saveGwikidata(button, attr);
}

MenuManager.prototype.openEditor = function(button, attr) {
    gwikiManager.exec(attr, function() {
        this.openEditor();
    });
}

MenuManager.prototype.editContent = function(button, attr) {
    gwikiManager.exec(attr, function() {
        this.openEditPage();
    });
}


MenuManager.prototype.setHighlight = function(mode, name) {
    var elements = $(this.menuDiv_).find('[data-attr="'+name+'"]');
    if(mode)
        elements.addClass('highlight');
    else
        elements.removeClass('highlight');
}

MenuManager.prototype.infoMessage = function(msg) {
    console.info(msg);
}