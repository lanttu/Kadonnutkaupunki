function Dialog() {
    // console.info('Dialog');
    this.div_ = null;
    this.setMap(map);
}

Dialog.prototype = new google.maps.OverlayView();

Dialog.prototype.init = function() {
    // console.info('Dialog.init, editState: '+this.get('editState'));
    google.maps.event.addListener(this, 'state_changed', function() {
        var state = this.get('state');
        var editState = this.get('editState');
        // console.info('Dialog.state_changed: '+state);
        if(editState >= 4) {
            switch(state) {
                case 3:
                    this.clearDiv();
                break;
                case 4:
                    this.showContent();
                break;
            }
        }
    });
    google.maps.event.addListener(this, 'editstate_changed', function() {
        var editState = this.get('editState');
        // console.info('Dialog.editstate_changed: '+editState);
        switch(editState) {
            case 0:
                this.clearDiv();
            break;
            case 1:
                this.showCreateNew();
            break;
            case 2:
                this.showMetaEdit();
            break;
            case 3:
                //
            break;
            case 4:
                this.showContentEdit();
            break;
            case 5:
                // 
            break;
        }
    });

    google.maps.event.addListener(this, 'position_changed', function() {
        var proj = this.getProjection();
        if(proj) {
            var latLng = this.get('position');
            var pos = proj.fromLatLngToContainerPixel(latLng);

            this.set('x', pos.x + 30);
            this.set('y', pos.y + 30);
        }
    });  
}

Dialog.prototype.draw  = function() {
    // console.info('Dialog.draw');
    var proj = this.getProjection();
    var latLng = this.get('position');
    if(latLng) {
        var pos = proj.fromLatLngToContainerPixel(latLng);

        this.set('x', pos.x+30);
        this.set('y', pos.y+30);
    }
}

Dialog.prototype.isOpen = function() {
    if ( this.div_ ) {
        return true;
    } else {
        return false;
    }
}

Dialog.prototype.clearDiv = function() {
    if ( this.div_ ) {
        this.div_.dialog('remove');
        this.div_.html('');
        this.div_.remove();
        this.div_ = null;
    }
}

Dialog.prototype.showContent = function() {
    this.clearDiv();
    // console.info('Dialog.showContent');
    var url = this.get('contentUrl');
    var div = $('<div><iframe src="' 
                + url + '" style="background-color:transparent;" allowtransparency="true" \
                 width="780" height="550" \
                 marginwidth="0" marginheight="0" frameborder="0" /></div>')
                .appendTo('body');
    this.div_ = div;

    var me = this;
    
    div.dialog({
        height: 600,
        width: 800,
        overflow: "hidden",
        position: [this.get('x'), this.get('y')],
        // dialogClass: this.get('class'),
        title: '<a class="iframe-back" href="">' + this.get('title') + '</a>',
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
    }).parents('.ui-dialog:eq(0)').wrap('<div class="' + this.get('class') + '"/>'); // Adds specific theme


    $(div).parent().find('.iframe-back').click(function() {
        div.find('iframe').attr('src', url);
        return false;
    });

}

Dialog.prototype.showCreateNew = function() {

    this.clearDiv();

    var div = $('<div></div>').appendTo('body');
    this.div_ = div;
    var me = this;

    div.load('pageparts/select_type.html', function() {

        div.dialog({
            height: 200,
            width: 400,
            title: 'Valitse luotavan kohteen tyyppi',
            close: function() {
                var editState = me.get('editState');
                if(editState < 3)
                    me.set('editState', 0);
            }
        })
        
        $('#typeset').buttonset();
        $('#submit-page').button();

        $('#submit-page').click(function() {
            me.set('type', $('input[name="type"]:checked').val());

            var type = me.get('type');
            if(type == 'Tapahtuma' || type == 'Paikka') {
                menuManager.setCrosshairMode(true);
                me.clearDiv();

                var div = $('<div></div>').appendTo('body');
                me.div_ = div;
                div.load('pageparts/click_map.html', function() {
                    div.dialog({
                        height: 100,
                        width: 200,
                        position:'top'
                    });
                    google.maps.event.addListenerOnce(map, 'click', function(e) {
                        menuManager.setCrosshairMode(false);
                        // Store event coordinates
                        me.set('position', e.latLng);
                        me.set('editState', 2);
                    });
                });
            }
            else {
                me.set('editState', 2);
            }
        });
    });
}


Dialog.prototype.showMetaEdit = function() {
    iconUrlPrefix = '/imgs/symbols/'+this.get('type')+'/';
    listIconsUrl = '/imgs/symbols/'+this.get('type')+'/list.xml';

    this.clearDiv();

    var editState = this.get('editState');
    var type = this.get('type');

    var s = '<dl class="form">';

    if(editState == 2) {
        s += '<dt>Nimi<div style="color:red" id="page-name-error"></div></dt><dd><input type="text" id="page-name"/></dd>';
    }
    // if(type == 'Tapahtuma' || type == 'Paikka') {
    //     s +='<dt>Sijainti kartalla</dt><dd><input type="text" id="address" value="'+this.get('address')+'"/></dd>';
    // }
    // if(type == 'Tapahtuma' || type == 'Tehtävä') {
    //     s += '<dt>Ajankohta</dt><dd><input type="text" id="date" value="'+this.get('date')+'" /></dd>';
    // }

    if(type == 'Tapahtuma' || type == 'Paikka') {
        s += '<dt>Symboli<div style="color:red;" id="icon-error"></div></dt><dd><img id="icon" value="' 
            + this.get('icon') + '" src="' + this.get('iconUrl') 
            + '"/><div id="icons"></div></dd>';
    }

    s += '<dt>Tagit</dt><dd><ul id="categories">';
    this.get('categories').forEach(function(b,i) {
        s += '<li><span>'+b+'</span> <a class="remove-category" href="">Poista</a></li>';
    });
    s += '</ul><input type="text" id="new-category"/><button id="add-category">Lisää</button></dd>';


    s += '<dt><button id="submit-edit">Seuraava</button></dt></dl>';

    var div = $(s).appendTo('body');
    this.div_ = div;

    div.dialog({
        height: 400,
        width: 400,
        position: [this.get('x'), this.get('y')],
        title: type,
        // dialogClass: this.get('class'),
        close: function() {
            var editState = me.get('editState');
            if( editState < 3 ) {
                me.set('editState', 0);
            }
            div.parents('.ui-dialog:eq(0)').unwrap(); // Remove wrapper, see below
            div.remove(); 

        }
    }).parents('.ui-dialog:eq(0)').wrap('<div class="' + this.get('class') + '"/>');

    $('#page-name').keyup($.debounce(function() {
        var pageName = $(this).val();
        if(pageName != '') {
            $.ajax({
                url: wikiUrl + pageName,
                data:{},
                success: function(data, status, request) {
                    $('#page-name-error').html('Nimi on jo olemassa');
                    $('#page-name').addClass('error');
                    $('#submit-edit').button('option','disabled', true);
                },
                error: function(request, status, error) {
                    if(request.status == 404) {
                        $('#page-name-error').html('');
                        $('#page-name').removeClass('error');
                        $('#submit-edit').button('option','disabled', false);
                    }
                }
            });
        }
        else {
            $('#submit-edit').button('option','disabled', true);
            $('#page-name').addClass('error');
            $('#page-name-error').html('Sivun nimi puuttuu');
        }
    }, 300));

    $('#submit-edit').button();
    $('#add-category').button();

    $('#add-category').click(function() {
        var val = $('#new-category').val();
        var categoryName = parseCategory(val);
        if(categoryName) {
            $('<li><span>'+categoryName+'</span> <a class="remove-category" href="">Poista</a></li>').appendTo('#categories').children('a').each(function() {
                $(this).click(function() {
                    $(this).parent().remove();
                    return false;
                });
            });
            $('#new-category').val('');
        }
    });
    $('#categories > li > a').each(function() {
        $(this).click(function() {
            $(this).parent().remove();
            return false;
        });
    });

    if(type == 'Tapahtuma' || type == 'Paikka') {

        var iconsDiv = $('#icons');
        var selectedImg = $('#icon');

        $.ajax({
            url: listIconsUrl,
            dataType: 'xml',
            success: function(data) {
                $(data).find('symbol').each(function() {
                    var icon = $(this).text();
                    $('<img src="'+iconUrlPrefix+icon+'" value="'+icon+'"/>').click(function() {
                        var src = $(this).attr('src');
                        var icon = $(this).attr('value');
                        selectedImg.attr('src', src);
                        selectedImg.attr('value', icon);
                        // iconsDiv.hide();
                    }).appendTo(iconsDiv);                    
                });
            }
        });

        selectedImg.click(function() {
            // iconsDiv.toggle();
        });

    }


    var me = this;
    $('#submit-edit').click(function() {

        if($('#icon').attr('value') == 'undefined') {
            $('#icon-error').text('Kuvaketta ei valittu');
            return false;
        }

        if(editState == 2) {
            if($('#page-name').val() == '') {
                $('#page-name-error').text('Tapahtumalla ei ole nimeä');
                return false;
            }
            me.set('name', $('#page-name').val());
        }

        me.set('address', $('#address').val());
        me.set('contact', $('#contact').val());
        me.set('date', $('#date').val());

        var categories = new google.maps.MVCArray();
        $('#categories > li > span').each(function() {
            categories.push($(this).text());
        });
        me.set('categories', categories);
        me.set('icon', $('#icon').attr('value'));

        var oldEditState = me.get('editState');
        me.set('editState', 3);
        div.dialog('close');



        return false;
    });

    // $('#add-overlay').click(function() {
    //     me.get('bounds').push('NEW');
    // });
}

Dialog.prototype.showContentEdit = function() {
    this.clearDiv();
    var div = $('<div><iframe width="780" height="550" marginwidth="0" marginheight="0" frameborder="0" src="'+this.get('contentEditUrl')+'"></iframe></div>').appendTo('body');
    this.div_ = div;
    
    div.dialog({
        height: 600,
        width: 800,
        position: [this.get('x'), this.get('y')],
        title: this.get('name'),
        dialogClass: this.get('class')
    });
}
