function GwikiManager() {
    this.gwikimodels_ = {};
    this.categories_ = {};
}


GwikiManager.prototype.create = function(name, data) {
    var m = new Gwikimodel();

    // Page name, identifier
    m.set( 'name', name );

    // If title is not set, use name
    var title;
    if ( data['title_' + lang] !== undefined 
        && data['title_' + lang][0] !== undefined ) {

        title = data['title_' + lang][0];

    } else {
        title = name;
    }

    m.set( 'title', title );

    // var contentUrl;


    // Page type
    if(data.type && data.type[0])
        m.set('type', data.type[0]);
    else
        m.set('type', 'Tapahtuma');
    
    // Primary position
    if(data.gwikicoordinates && data.gwikicoordinates[0])
        m.set('position',coordsToLatLng(data.gwikicoordinates[0]));
    
    // Bounds
    var bounds = null;
    if(data.gwikibounds) {
        bounds = new google.maps.MVCArray();
        for ( var i in data.gwikibounds ) {
            bounds.push( gwikiboundsToLatLngBounds(data.gwikibounds[i]) );
        }
    }
    m.set( "bounds", bounds );

    // Icon
    if(data.gwikishapefile && data.gwikishapefile[0])
        m.set('icon', data.gwikishapefile[0]);

    // Overlay image
    if(data.overlayimage && data.overlayimage[0])
        m.set('overlayImage', data.overlayimage[0]);

    var overlayImages = new google.maps.MVCArray();
    if ( data.overlayimage ) {
        for ( var i in data.overlayimage ) {
            overlayImages.push( data.overlayimage[i] );
        }
    }
    m.set( 'overlayImages', overlayImages);

    var paths = null;
    if ( data.gwikipath ) {
        paths = new google.maps.MVCArray();
        for ( var i in data.gwikipath ) {
            try {
                eval( "var values = [" + data.gwikipath[i] + "]" );
                var path = new google.maps.MVCArray();
                for ( var j in values ) {
                    path.push(wToLatLng(values[j]));
                }
                paths.push( path );

            } catch ( err ) {
                console.info( err );
            }
        }
    }
    m.set( "paths", paths );

    // Categories
    var categories = [];
    if(data.gwikicategory) {
        for(var i in data.gwikicategory) {
            var c = data.gwikicategory[i];
            // CategoryKk -> Kk
            c = c.slice(8);
            categories.push(c);
        }
    }
    m.set('categories', categories);

    m.set( 'map', map );
    m.set( 'editState', 5 );

    m.init(1);
    // console.info('Model created');
    return m;
}

GwikiManager.prototype.save = function(model, callback) {
    var name = model.get('name');
    if(!name)
        throw 'No name';
    var data = {};

    data.type = [model.get('type')];

    if(model.get('position'))
        data.gwikicoordinates = [latLngToCoords(model.get('position'))];

    data.gwikibounds = [];
    model.get('bounds').forEach(function(b, i) {
        data.gwikibounds.push(latLngBoundsToGwikibounds(b));
    });

    if(model.get('icon'))
        data.gwikishapefile = [model.get('icon')];

    if(model.get('overlayImage'))
        data.overlayimage = [model.get('overlayImage')];

    // if(mode.get('contact'))
    // data.contact = [model.get('contact')];

    if(model.get('address'))
        data.address = [model.get('address')];

    if(model.get('date'))
        data.date = [model.get('date')];

    data.gwikicategory = [];
    model.get('categories').forEach(function(c, i) {
        data.gwikicategory.push('Category'+c);
    });

    data.gwikidata = ['yes'];

    var params = {
        'action': 'setMetaJSON',
        'args': '{"'+name+'":'+JSON.stringify(data)+'}'
    };

    $.post(wikiUrl, params, function(response) {
        if(response.status) {
            if ( $.isFunction(callback) ) {
                callback.call( model );
            }
        }
    }, 'json');

}


/* 
    Loads given name(s) from server and calls callback for each 
*/
GwikiManager.prototype.load = function(names, callback) {
    var data = {'action': 'getMetaJSON'};
    
    if(typeof(names) == 'string')
        data.args = names;
    else if(names.length > 0) {
        data.args = '/' + names[0] + '$';;
        if(names.length > 1) {
            for(var i = 1 ; i < names.length; i++) {
                data.args += '|'+names[i] +'$';
            }
        }
        data.args += '/';
    }
    else
        return;

    var me = this;
    $.get( wikiUrl, data, function( response, textStatus ) {
        for ( var name in response ) {
            if ( response[name].gwikidata 
                && response[name].gwikidata[0] == 'yes') {
                var m = me.create( name, response[name] );
                if( $.isFunction(callback) ) {
                    callback.apply(m);
                }
            }
        }
    });
}


/*
    Gwikidata calls this to inform manager about itself
*/
GwikiManager.prototype.add = function( model ) {
    // console.info(model);
    var name = model.get( 'name' );
    if( name ) {
        if( this.has( name ) ) {
            var d = this.get(name);
            d.set('state', 0);
            delete d;
        }
        this.gwikimodels_[name] = model;
    }
}


GwikiManager.prototype.remove = function(model) {
    var name = model.get('name');
    if(name) {
        if(this.has(name)) {
            model.set('state', 0);
            delete this.gwikimodels_[name]
        }
    }
}


GwikiManager.prototype.has = function(obj) {
    if ( typeof( obj ) == 'object' ) {
        var name = obj.get('name');
    } else {
        var name = obj;
    }
    
    if ( name in this.gwikimodels_ ) {
        return true;
    } else {
        return false;
    }
}

/*
    Retrieves data from server if not available and then calls func for
    each object
*/
GwikiManager.prototype.exec = function(names, func) {
    if ( typeof( names ) == 'string' ) {
        // Only one
        if( this.has(names) && $.isFunction(func) ) {
            func.apply( this.get(names) );
        }
        else {
            this.load(names, func);
        }
    }
    else {
        var get = [];   // These are already requested
        var load = [];  // These are not yet present

        for(var i in names) {
            if( this.has(names[i]) ) {
                get.push(names[i]);
            } else {
                load.push( names[i] );
            }
        }

        if ( load.length > 0 ) {
            this.load(load, func);
        }
        if ( $.isFunction(func) ) {
            for(var i in get) {
                func.apply(this.get(get[i]));
            }
        }
    }
}

GwikiManager.prototype.each = function(callback) {
    for(var name in this.gwikimodels_) {
        callback.apply(this.gwikimodels_[name]);
    }
}

GwikiManager.prototype.get = function(name) {
    if(this.has(name))
        return this.gwikimodels_[name];
    else
        return null;
}

GwikiManager.prototype.show = function( name ) {
    this.exec( name, function() {
        this.show();
    });
}

/*
    Shows category and hides everything else  

*/
GwikiManager.prototype.showCategory = function(categoryName, type) {
    this.execCategory(categoryName, function() {
        this.execEach(function() {
            if(!type || type == this.get('type')) {
                // console.info(this.get('name'));
                // console.info(this);
                this.set('state', 2);
            }
        });
    });
}

GwikiManager.prototype.hideCategory = function(categoryName, type) {
    this.execCategory(categoryName, function() {
        this.execEach(function() {
            if(!type || this.get('type') == type) {
                this.hide();
            }
        });
    });
}


/*
    Loads pages connected to given category/(ies)
*/
GwikiManager.prototype.loadCategory = function(categoryName, callback) {
    if ( typeof(categoryName) == 'string' ) {
        if ( categoryName == 'All' ) {
            var args = 'gwikidata=yes';
        } else if ( categoryName == 'Muut' ) {
            var args = 'gwikicategory!=CategoryViralliset,gwikidata=yes';
        } else {
            var args = 'Category' + categoryName;
        }
        var me = this;
        $.get( 
            wikiUrl, 
            {'action':'getMetaJSON', 'args': args}, 
            function(response, statusText ) {
                
            var names = [];
            for(var name in response) {
                if(response[name].gwikidata && response[name].gwikidata[0] == 'yes') {
                    names.push(name);
                    if(!me.has(name)) { // Don't create new model if there is already one, otherwise might cause status changes etc.
                        var m = me.create(name, response[name]);
                    }
                }
            }
            var category = new Category(names);
            me.categories_[categoryName] = category;
            if(callback)
                category.exec(callback);
        });
    }
    else {
        for(var i in categoryName) {
            this.loadCategory(categoryName[i], callback);
        }
    }
    
}


GwikiManager.prototype.loadRecentChangesCategory = function(callback) {
    var me = this;
    $.get(wikiUrl, {action: 'recentchanges_json'}, function(data) {
        var pages = [];
        for(var i in data.logdata) {
            if(!me.has(data.logdata[i].pagename))
                pages.push(data.logdata[i].pagename);
        }
        var gwikidatas = [];
        me.load(pages, function() {
            gwikidatas.push(this.get('name'));
        });
        var category = new Category(gwikidatas);
        me.categories_['RecentChanges'] = category;
        if(callback)
            category.exec(callback);

    });
}


GwikiManager.prototype.hasCategory = function(categoryName) {
    if(categoryName in this.categories_)
        return true;
    else
        return false;
}

GwikiManager.prototype.getCategory = function(categoryName) {
    return this.categories_[categoryName];
}

GwikiManager.prototype.execCategory = function(categoryName, func) {
    if(this.hasCategory(categoryName)) {
        var category = this.getCategory(categoryName);
        category.exec(func);
    }
    else {
        this.loadCategory(categoryName, func);
    }
}


/*
    Category
*/

function Category(pages) {
    if(pages)
        this.pages_ = pages;
    else
        this.pages_ = [];
}

Category.prototype.exec = function(func) {
    func.apply(this);
}

Category.prototype.execEach = function(func) {
    gwikiManager.exec(this.pages_, func);
}
