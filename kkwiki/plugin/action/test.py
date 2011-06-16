# -*- coding: iso-8859-1 -*-

import json
def execute(pagename, request):
    request.emit_http_headers(["Content-Type: application/json"])
    _ = request.getText

    request.write("TESTIÄ PUKKAA")
