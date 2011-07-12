import json
import pprint
import re

from MoinMoin.formatter.text_html import Formatter
from graphingwiki.editing import get_pages, get_metas
from MoinMoin.Page import Page


def execute(pagename, request):
    request.emit_http_headers(["Content-Type: application/json"])

    metas = get_metas(request, pagename, ["gwikidata"])
    # pp = pprint.PrettyPrinter(depth=6)
    # request.write(pp.pformat(metas))
    # return

    may = request.user.may

    actions = dict(
        edit = may.write(pagename),
        delete = may.delete(pagename)
    )

    request.write(json.dumps(actions))
    return

        
