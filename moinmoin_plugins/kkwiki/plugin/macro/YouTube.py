# -*- coding: iso-8859-1 -*-
u"""
    MoinMoin - YouTube macro Version 0.5
               Displays an embedded object with the wanted video or
               displays a list of videos (videobar).

    <<YouTube(id="YouTubeID", keyword="keyword")>>
    Default is to use the current pagename as keyword.

    Examples:
     * <<YouTube>>
     * <<YouTube(id=2SXKM-dLJV8)>>
     * <<YouTube(keyword="iron maiden")>>

    @copyright: 2008 by MarcelH�fner (http://moinmo.in/MarcelH�fner),
                2010 by ThomasWaldmann (http://moinmo.in/ThomasWaldmann)
    @license: GNU GPL, see COPYING for details.

    Attention! The "keyword" part is created with the "Google AJAX Search API Tools".
    Licence Information can be viewed under: http://code.google.com/intl/de-DE/apis/ajaxsearch/terms.html

    @TODO:
     * Change the hardcoded https string into http/https depending on the requested url.
     * Don't use the google ajax stuff.
     * Check if youtube videos are disabled (mimetypes_xss).

"""

from MoinMoin import wikiutil


def macro_YouTube(macro, id, keyword):
    request = macro.request
    _ = request.getText
    html = u""

    if id is None and keyword is None:
        # default: keyword will be used and default to current page name
        keyword = macro.formatter.page.page_name

    if keyword is not None:
        # for the videobar to display the flash videos (keyword)
        parameters = {
            "keyword":  wikiutil.escape(keyword),
            "msg_youtubelink": _("View the related videos on YouTube."),
        }
        html = u"""
        <div class="youtube youtube_keyword">
            <!-- ++Begin Video Bar Wizard Generated Code++ -->
              <!--
              // Created with a Google AJAX Search Wizard
              // http://code.google.com/apis/ajaxsearch/wizards.html
              -->

              <!--
              // The Following div element will end up holding the actual videobar.
              // You can place this anywhere on your page.
              -->
              <div id="videoBar-bar">
                <span style="color:#676767;font-size:11px;margin:10px;padding:4px;">Loading...</span>
              </div>

              <!-- Ajax Search Api and Stylesheet
              // Note: If you are already using the AJAX Search API, then do not include it
              //       or its stylesheet again.
              -->
              <script src="https://www.google.com/uds/api?file=uds.js&v=1.0&source=uds-vbw"
                type="text/javascript"></script>
              <style type="text/css">
                @import url("https://www.google.com/uds/css/gsearch.css");
              </style>

              <!-- Video Bar Code and Stylesheet -->
              <script type="text/javascript">
                window._uds_vbw_donotrepair = true;
              </script>
              <script src="https://www.google.com/uds/solutions/videobar/gsvideobar.js?mode=new"
                type="text/javascript"></script>
              <style type="text/css">
                @import url("https://www.google.com/uds/solutions/videobar/gsvideobar.css");
              </style>

              <style type="text/css">
                .playerInnerBox_gsvb .player_gsvb {
                  width : 320px;
                  height : 260px;
                }
              </style>
              <script type="text/javascript">
                function LoadVideoBar() {

                var videoBar;
                var options = {
                    largeResultSet : !true,
                    horizontal : true,
                    autoExecuteList : {
                      cycleTime : GSvideoBar.CYCLE_TIME_MEDIUM,
                      cycleMode : GSvideoBar.CYCLE_MODE_LINEAR,
                      executeList : ["%(keyword)s"]
                    }
                  }

                videoBar = new GSvideoBar(document.getElementById("videoBar-bar"),
                                          GSvideoBar.PLAYER_ROOT_FLOATING,
                                          options);
                }
                // arrange for this function to be called during body.onload
                // event processing
                GSearch.setOnLoadCallback(LoadVideoBar);
              </script>
            <!-- ++End Video Bar Wizard Generated Code++ -->
            <p class="youtube_link" style="display:none;">
                <a href="http://www.youtube.com/results?search_query=%(keyword)s">%(msg_youtubelink)s</a>
            </p>
        </div>
        """ % parameters

    if id is not None:
        # for the embedded flashplayer to play a single video (id)
        parameters = {
            "id":  wikiutil.escape(id),
            "msg_youtubelink": _("View the video on YouTube."),
        }
        html = u"""
        <div class="youtube youtube_id">

            <object width="425" height="344">
                <param name="movie" value="http://www.youtube.com/v/%(id)s&rel=0&fs=1"></param>
                <param name="rel" value="0"></param>
                <param name="allowFullScreen" value="true"></param>
                <param name="wmode" value="opaque"></param>
                <embed src="http://www.youtube.com/v/%(id)s&fs=1&rel=0"
                    type="application/x-shockwave-flash"
                    allowfullscreen="true"
                    rel="false"
                    width="425" height="344"
                    wmode="opaque">
                </embed>
            </object>

            <p class="youtube_link" style="display:none;">
                <a href="http://www.youtube.com/v/%(id)s&fs=1&rel=0">%(msg_youtubelink)s</a>
            </p>

        </div>
        """ % parameters

    return macro.formatter.rawHTML(html)

