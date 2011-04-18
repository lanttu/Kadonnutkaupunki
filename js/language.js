(function( $ ){

    var methods = {
        init: function ( language ) {

            if ( !language ) {
                return;
            }

            this.each( function() {
                var c = $( this ).data( language );
                if ( c ) {
                    $( this ).html( c );
                }

                $( '[data-' + language + ']', this ).each( function() {
                    $( this ).html( $( this ).data( language ) );
                });
            });
        }
    };

    $.fn.language = function( method ) {
        // if ( methods[method] ) {
            // return methods[method].apply( this, Array.prototype.slice.call( arguments, 1) );
        if ( typeof method === "string" || !method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( "Method " +  method + " does not exist on jQuery.language" );
        }
    }

})( jQuery );