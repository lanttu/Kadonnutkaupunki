var categories = {
    "Taukopaikka": {
        // position: true,
        color: "#fff",
    },
    "Erityinen kohde": {
        position: true,
        color: "#f0f",
    },
    "Reitin varren kohde": {
        position: true,
        color: "#f5f",
    },
    "Kaukomaisema": {
        position: true,
        color: "#333",
    },
    "Lähimaisema": {
        position: true,
        color: "#111",
    },
    "Vesistö": {
        position: true,
        color: "#999",
    },
    "Luontokohde": {
        position: true,
        color: "#000"
    },
    "Tarina": {
        position: true,
        color: "#EEE"
    }
};

var map;

var minZoom = 10;
var maxZoom = 16;

var objectManager;
var menuManager;
var imageOverlayMap;
var colorOverlayMap;

var gwikiManager;

var validUser = false;
var username = '';

var wikiUrl = '/wiki/';
var mapStylePrefix = '/mapstyles/';

var lang = 'fi';
var defaultLang = 'fi';

var modelCreator = null;

$(document).ready(function() {
    var args = getUrlArgs();
     
    if ( args['page'] ) {
        var pageName = args['page'];
    } else {
        var pageName = 'Ruka';
    }
    
    gwikiManager = new GwikiManager();

    var mapModel = new MapModel(pageName, function() {

        map = new google.maps.Map( document.getElementById("map"), {
            center: this.get('position'),
            streetViewControl: false,
            mapTypeControlOptions: {
                mapTypeIds: [ "styled", google.maps.MapTypeId.SATELLITE]
            },
            zoom: minZoom,
            disableDoubleClickZoom: true,
        });
        
        setMapStyle();
                
        menuManager = new MenuManager();

        limitZoom(minZoom, maxZoom);

        whoAmI();

    });
});

function limitZoom(min, max) {
    google.maps.event.addListener(map, 'zoom_changed', function() {
        if(map.getZoom() < min) {
            map.setZoom(min);
        }
        else if(map.getZoom() > max) {
            map.setZoom(max);
        }
    });
}

function openPage(url, onComplete, onClosed, title, width, height, cls) {
    if(!width)
        width = 570;
    if(!height)
        height = 600;

    var div = $('<div style="margin:0;padding:0"><iframe src="' + url + '" width="100%" height="99%" style="background-color:transparent;" allowtransparency="true" frameborder=0 /></div>').appendTo('body');
    div.dialog({
        title: '<a href="" class="iframe-back">' + title + '</a>',
        width: width,
        height: height,
        // dialogClass: cls,
        close: function() {
            if(onClosed) {
                onClosed.call(div);
            }
            div.parents('.ui-dialog:eq(0)').unwrap(); // Remove wrapper, see below
            div.remove(); 
        },
        open: function() {
            // This should force iframe to load right content
            var iframe = div.find('iframe').get();
            iframe.src = iframe.src;
            if(onComplete) {
                onComplete.call(div);
            }
        },
        resize: function() {
            
        }
    // Wraps dialog in classed div to make theme scoping work correctyl
    }).parents('.ui-dialog:eq(0)').wrap('<div class="' + cls + '"/>'); 

    $(div).parent().find('.iframe-back').click(function() {
        div.find('iframe').attr('src', url);
        return false;
    });
}

function setMapStyle(mapStyle) {
    if(mapStyle) {
        $.getScript(mapStylePrefix + mapStyle + '.js', function(data, textStatus) {
            if(style) {
                var styledMap = new google.maps.StyledMapType(style, {name: "Kartta"});
                map.mapTypes.set('styled', styledMap);
                map.setMapTypeId('styled');
            }
            else {
                // console.info('Style loading failed');
                // console.info(style);
            }
        });
    }
    else {
        var styledMap = new google.maps.StyledMapType(style, {name: "Kartta"});
        map.mapTypes.set('styled', styledMap);
        map.setMapTypeId('styled');
    }
}

function getUrlArgs() {
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    var args = {};
    for(var i in hashes) {
        var p = hashes[i].split('=');
        if(p.length == 2)
            args[p[0]] = p[1];
    }
    return args;
}

function parseCategory(name) {
    if(name.length < 1)
        return false;
    name = name.replace(/ /g, '');
    name.toLowerCase();
    var f = name.slice(0,1).toUpperCase();
    name = f.concat(name.slice(1));
    return name;
}

function wToLatLng(v1,v2) {
    if ( v2 === undefined ) {
        return new google.maps.LatLng(v1[1], v1[0]);
    } else {
        return new google.maps.LatLng(v2,v1);
    }
}


function whoAmI(callback) {
    $.getJSON(wikiUrl, {action: 'whoami_json'}, function(data) {
        if(data.status == 'ok' && data.valid == 1) {
            validUser = true;
            username = data.username;
            var success = true;
        }
        else {
            validUser = false;
            username = '';
            var success = false;
        }
        if(callback) {
            callback(success);
        }
        menuManager.updateLoginStatus();
    });
}


function showLogin() {
    var div = $( '<div></div>' ).appendTo( 'body' );
    div.load( 'pageparts/login.html', function() {
        div.dialog({
            title: 'Kirjaudu sisään',
            width: 370,
            height: 250,
            close: function() {
                div.remove();
            }
        });

        $('#login').button().click(function() {

            var username = $('#username').val();
            var password = $('#password').val();
            
            $.post(wikiUrl, {action: 'login', login: 'Kirjaudu sisään', name: username, password: password}, function(data, status) {
                whoAmI(function(success) {
                    if(success) {
                        div.dialog('close');
                    }
                    else {
                        $('#login-error').text('Väärä käyttäjänimi tai salasana');
                    }
                });
            });
            return false;
        });

        $('#create-account').click(function() {
            div.dialog('option', 'height', 400); // resize dialog
            div.dialog('option', 'title', 'Luo uusi käyttäjätunnus');
            div.load( 'pageparts/createuser_part1.html', function() {
                // $( div.language( 'en' ) );
                $( '#create-user button' ).button();

                $( '#create-user' ).submit(function() {
                    var username = $('#username').val();
                    var pw = $('#password').val();
                    var email = $('#email').val();
                    // var name = $('#name').val();
                    // var title = $('#title').val();

                    $.post(
                        wikiUrl, 
                        {
                            action: 'kknewaccount', 
                            name: username, 
                            password: pw, 
                            email: email
                        }, function(data) {

                        if(data == 'User account created! You can use this account to login now...') {
                            div.dialog('option', 'height', 200);
                            div.dialog('option', 'title', 'Kiitos!');
                            div.load( 'pageparts/createuser_part2.html' );
                            
                        }
                        else {
                            $('#createaccount-error').text( data );
                        }
                    });
                    return false;
                });
            });
            return false;
        });
    });

}