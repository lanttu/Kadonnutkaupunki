import json
import pprint
import re

from MoinMoin.formatter.text_html import Formatter
from graphingwiki.editing import get_pages, get_metas
from MoinMoin.Page import Page


def execute(pagename, request):
    request.emit_http_headers(["Content-Type: text/html;"])

    metas = get_metas(request, pagename, ["gwikidata"])
    # pp = pprint.PrettyPrinter(depth=6)
    # request.write(pp.pformat(metas))
    # return

    if len(metas['gwikidata']) > 0 and metas['gwikidata'][0] == 'yes':
        # Content is in subpage

        language = request.form.get('language', [None])[0]
        if not language:
            language = 'fi'


        filterFn = re.compile(
            ur"^%s/%s$" % (re.escape(pagename), re.escape(language)), 
            re.U
        ).match
        subpageNames = request.rootpage.getPageList(user='', exists=1, filter=filterFn)

        if (len(subpageNames) == 0):
            filterFn = re.compile(
                ur"^%s/text$" % (re.escape(pagename)), 
                re.U
            ).match
            subpageNames = request.rootpage.getPageList(user='', exists=1, filter=filterFn)

        if (len(subpageNames) == 0):
            subpageNames = [u'NoContent']

        contentPage = Page(request, subpageNames[0])
        
    else:
        contentPage = Page(request, pagename)
    request.write(contentPage.send_page(content_only=True))
