/*
    input
    select
    tag-list

    fields = {
        name: {
            label
            type
            value
            callback
            values
        }
    }

*/

function GwikiEditor(gwikidata, fields) {
    this.gwikidata_ = gwikidata;
    this.fields_    = fields;
}

GwikiEditor.prototype.open = function() {
    var s = '<dl id="editor">';
    for(var name in this.fields_) {
        var field = this.fields_[name];
        s += '<dt>'+field.label+'</dt>';
        s += '<dd>';
        switch(field.type) {
            case 'input-text':
                s += '<input type="text" data-editor="'+name+'" value="'+field.value+'"/>';
            break;
            case 'input-radio':
                for(var i in field.values) {
                    s += '<input type="radio" name="'+name+'" data-editor="'+name+'" value="'+field.values[i]+'"';
                    if(field.value == field.values[i])
                        s += ' checked ';
                    s += '/>'+field.values[i];
                }
            break;
            case 'list':
                s += '<ul data-editor="'+name+'">';
                for(var i in field.values) {
                    s += '<li><span>'+field.values[i]+'</span> <a href="">x</a></li>';
                }
                s += '</ul>';
                s += '<input type="text" data-editor="'+name+'"/><button data-editor="'+name+'">Lisää</button>';
            break;
            case 'imagepicker':
                s += '<div data-editor="'+name+'"><img data-icon="'+field.value+'" src="'+field.url+field.value+'"/><div style="display:none;" class="icons"></div></div>';
            break;
            default:
                console.info('Unknown field type');
            break;
        }
        s += '</dd>';
    }
    s += '<dt><button id="submit-editor">Aseta</button><button id="cancel-editor">Peruuta</button></dt></dl>';

    var me = this;
    $.colorbox({
        html: s,
        open: true,
        width: '400px',
        height: '400px',
        onComplete: function() {
            for(var name in me.fields_) {
                var field = me.fields_[name];
                switch(field.type) {
                    case 'input-text':
                    break;
                    case 'input-radio':
                    break;
                    case 'list':
                        me.activateList(name, field);
                    break;
                    case 'imagepicker':
                        me.activateImagepicker(name, field);
                    break;
                }
            }

            $('#submit-editor').click(function() {
                me.save();
                $.colorbox.close();
            });

            $('#cancel-editor').click(function() {
                $.colorbox.close();
            });
        },
        onClosed: function() {
            delete me;
        }
    });
}

GwikiEditor.prototype.activateImagepicker = function(name, field) {
    // Fetch available icons
    var div = $('div[data-editor="'+name+'"]');
    var iconsDiv = div.children('div.icons');
    var selectedImg = div.children('img');

    field.icons(function(icon) {
        $('<img src="'+field.url+icon+'" data-icon="'+icon+'"/>').click(function() {
            var src = $(this).attr('src');
            var icon = $(this).attr('data-icon');
            selectedImg.attr('src', src);
            selectedImg.attr('data-icon', icon);
            iconsDiv.hide();
        }).appendTo(iconsDiv);
    });
    selectedImg.click(function() {
        iconsDiv.toggle();
    });
}

GwikiEditor.prototype.activateList = function(name, field) {
    $('button[data-editor="'+name+'"]').click(function() {
        var val = $('input[data-editor="'+name+'"]').val();
        var categoryName = parseCategory(val);
        if(categoryName) {
            $('<li><span>'+categoryName+'</span> <a href="">x</a></li>').appendTo('ul[data-editor="'+name+'"]').children('a').click(function() {
                $(this).parent().remove();
                return false;
            });
            // $('ul[data-editor="'+name+'"]').append;
            $('input[data-editor="'+name+'"]').val('');
        }
    });
    $('ul[data-editor="'+name+'"] > li > a').click(function() {
        $(this).parent().remove();
        return false;
    });
}


GwikiEditor.prototype.save = function() {
    for(var name in this.fields_) {
        var field = this.fields_[name];
        switch(field.type) {
            case 'input-text':
                field.callback.call(this.gwikidata_, $('input[data-editor="'+name+'"]').val());
            break;
            case 'input-radio':
                field.callback.call(this.gwikidata_, $('input[data-editor="'+name+'"]:checked').val());
            break;
            case 'list':
                var values = [];
                $('ul[data-editor="'+name+'"] > li > span').each(function() {
                    values.push($(this).html());
                });
                field.callback.call(this.gwikidata_, values);
            break;
            case 'imagepicker':
                field.callback.call(this.gwikidata_, $('div[data-editor="'+name+'"] > img').attr('data-icon'));
            break;
                
        }
    }
}