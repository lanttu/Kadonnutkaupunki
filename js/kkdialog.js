
(function( $ ) {

    var defaultOptions = {
        cls: "test",
        width: 600,
        height: 450
    };

    var openDialogs = {};


    
    $.kkDialog = function( page, options ) {
        if ( !openDialogs[page] ) {
            // Open dialog

            if ( !options ) {
                options = {};
            }
            $.extend( options, defaultOptions );

            if ( options.title === undefined ) {
                options.title = page;
            }

            var wrapper = $( "<div>" )
                .addClass( options.cls ).addClass( "wrapper" );
            var dialog = $( "<div>" ).dialog( options );
            dialog.parents('.ui-dialog:eq(0)').wrap( wrapper );

            $( "<div>" ).addClass( "loading" ).appendTo( dialog );

            openDialogs[page] = dialog;

            $.ajax({
                url: encodeURI( wikiUrl + page ),
                // data: { mimetype: "html" },
                data: { action: "getContent" },
                success: function( data ) {
                    dialog.html( data );
                    // Links inside dialog
                    $( "a", dialog ).click(function() {
                        // TODO: Not very elegant
                        $.kkDialog( $(this).text() );
                        return false;
                    });
                },
                error: function( request, textStatus, error ) {
                    dialog.text( textStatus );
                },
            });

            dialog.bind( "dialogclose", function() {
                dialog.closest( ".wrapper" ).remove();
                dialog.remove();
                openDialogs[page] = null;
            });

        } else {
            // Close dialog
            // openDialogs[page].dialog( "close" );
            var dialog = openPages[page];
            dialog.closest( ".wrapper" ).remove();
            dialog.remove();
            openDialogs[page] = null;
        }
    }

})( jQuery );