# -*- coding: utf-8 -*-
"""
    FIXME DOCUMENT!

    @copyright: 2008 by therauli <therauli@ee.oulu.fi>
    @license: MIT <http://www.opensource.org/licenses/mit-license.php>

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use, copy,
    modify, merge, publish, distribute, sublicense, and/or sell copies
    of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
    DEALINGS IN THE SOFTWARE.

"""
import re
import calendar, datetime, time


from urllib import unquote as url_unquote
from urllib import quote as url_quote

from MoinMoin.Page import Page
from MoinMoin import config
from MoinMoin import wikiutil
from MoinMoin.parser.text_moin_wiki import Parser


from graphingwiki.editing import metatable_parseargs
from graphingwiki.editing import get_metas

Dependencies = ['metadata', 'time']

def execute(macro, args):
    request = macro.request
    action = 'showCalendarDate'
    if args is None:
        args = ''
    else:
        if args.startswith("action="):
            action = args.split(",")[0].split("=")[1]
            args = ",".join(args.split(",")[1:])

    # Note, metatable_parseargs deals with permissions
    pagelist, keys, s = metatable_parseargs(request, args, get_all_keys=True, checkAccess=False)
    _ = request.getText

    out = request

    entries = dict()

    for page in pagelist:
        metas = get_metas(request, page, keys, display=False, checkAccess=False)
        if u'Date' not in metas.keys():
            continue

        if metas[u'Date']:
            date = metas[u'Date'][0]
            datedata = entries.setdefault(date, list())
            entrycontent = dict()

            content = Page(request, page).getPageText()
            if '----' in content:
                content = content.split('----')[0]
            temp = list()
            for line in content.split("\n"):
                if not line.startswith("#acl"):
                    temp.append(line)
            content = "\n".join(temp)
            entrycontent['Content'] = content

            for meta in metas:
                if not metas[meta]:
                    continue
                entrycontent[meta] = metas[meta][0]
            datedata.append(entrycontent)

    #Getting current month
    now = datetime.datetime.today()
    today = now.strftime('%Y-%m-%d')
    now = now.replace(hour = 0, minute = 0, second = 0, microsecond = 0)
    year = now.year
    month = now.month
    
    if 'm' and 'y' in macro.form:
        month = int(macro.form['m'][0])
        year = int(macro.form['y'][0])
 
    cal = calendar.monthcalendar(year, month)

    try:
        last_date = now.replace(month = month + 1, day = 1)
    except ValueError:
        last_date = now.replace(month = 1, year = year + 1, day = 1)

    # counting week numbers

    first_date = now.replace(day = 1, year = year, month = month)

    weeknum = first_date.isocalendar()[1]

    #adding reoccurring events to dict

    new_entries = dict()

    for date in entries.values():
        for entry in date:
            if not 'Type' in entry:
                continue

            type = entry['Type']

            if type == 'Once' or type == '0':
                continue

            until = None
            if 'Until' in entry:
                until = datetime.datetime.fromtimestamp(time.mktime(time.strptime(entry['Until'], '%Y-%m-%d')))
                
            #FIXME tähän niitä weekly ym

            try:
                type = int(type)
            except ValueError:
                continue
            
            curdate = datetime.datetime.fromtimestamp(time.mktime(time.strptime(entry['Date'], '%Y-%m-%d')))

            delta = datetime.timedelta(days = type)

            while curdate <= last_date:
                if until:
                    if curdate >= until:
                        break
                curdate += delta
                newdate = curdate.strftime('%Y-%m-%d')
                
                new_entries.setdefault(newdate, list())
                new_entries[newdate].append(entry)

    for entry in new_entries:
        entries.setdefault(entry, list())
        entries[entry].extend(new_entries[entry])

    categories = [x.strip() for x in args.split(',') if 'Category' in x]
    categories = ','.join(categories)
    
    html = u'''
  <script type="text/javascript" src="%s/common/js/mootools-1.2-core-yc.js"></script>
  <script type="text/javascript" src="%s/common/js/mootools-1.2-more.js"></script>

<script type="text/javascript">
addLoadEvent(function(){
var dates = new Hash();
    \n''' % (request.cfg.url_prefix_static, request.cfg.url_prefix_static)

    for date, d in entries.iteritems():
        html += u'dates.set("%s","' % date
        for i, cont in enumerate(d):
            if i == 4:
                html += u'<br><b>%s more...</b>' % (len(d) - i)
                break
            try:
                start_time = cont['Time']
            except:
                start_time = "?"

            try:
                location = '&nbsp;*&nbsp;Location:&nbsp;&nbsp;%s <br> ' % cont['Location']
            except:
                location = ""

            try:
                cap = '&nbsp;*&nbsp;Capacity:&nbsp;&nbsp;%s <br>' % cont['Capacity']
            except:
                cap = ""

            try:
                desc = cont['Content'].replace('\n','')
                if len(desc) > 35:
                    desc = desc[0:35] + " ..."
            except:
                desc = "?"

            html += u'<b>%s :</b> %s<br>%s%s' % (start_time,desc,location,cap)

        html += u'");\n'
    html += u'''
   var links = $$('table#cat-%s > tbody > tr > td > a');
  var links = links.filter(function(el){
    return el.href.match("action=%s") != null;
    });
  var tips = new Tips(links);
  var content = '';
 links.each(function(el){
   topic = el.href.match(/\d{4}[-]\d\d[-]\d\d/)[0].clean();
   el.store('tip:title',topic);
  try{
  content = dates.get(topic);
  }catch(e){
  content = '';
    }
   if(content){
     td = el.getParent('td');
     td.setStyles({
       'background-color' : '#FFB6C1'
       });
     el.addEvents({
       'mouseenter': function(){
         el.setStyle('color', 'green');
         },
       'mouseleave': function(){
         el.setStyle('color','');
         }
      });
   }else{
    content = "No events"; 
   }
   el.store('tip:text',content);
   });
});
  </script>
   \n''' % (categories,action)
    out.write(html)

    output = ""
    #output += macro.formatter.table(1, {'id' : 'cat-%s' %categories})
    output += macro.formatter.rawHTML('<div><table id="cat-%s"><tbody>' %categories)

    output += macro.formatter.table_row(1)

    prev_month = month -1
    prev_year = year
    next_month = month +1
    next_year = year

    if month == 12:
        next_month = 1
        next_year = year +1
    elif month == 1:
        prev_month = 12
        prev_year = year - 1

    output += macro.formatter.rawHTML('<th colspan="8" class="calendar-month"><a href="?y=%s&m=%s"><</a> %s / %s <a href="?y=%s&m=%s">></a></th>' % (prev_year, prev_month, year, month, next_year, next_month))
    output += macro.formatter.table_row(0)

    output += macro.formatter.table_row(1)

    output += macro.formatter.table_cell(1, {'class': 'calendar-empty'})
    output += macro.formatter.table_cell(0)

    for i in 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun':
        if i in ['Sat', 'Sun']:
            output += macro.formatter.table_cell(1, {'class': 'calendar-topic-weekend'})
        else:
            output += macro.formatter.table_cell(1, {'class': 'calendar-topic-workday'})

        output += macro.formatter.text(i)
        output += macro.formatter.table_cell(0)
    output += macro.formatter.table_row(0)

    for week in cal:
        output += macro.formatter.table_row(1)
        output += macro.formatter.table_cell(1, {'class': 'calendar-weeknumber'})
        output += macro.formatter.text("%2d" % weeknum)
        output += macro.formatter.table_cell(0)
        weeknum += 1

        for i,day in enumerate(week):
            if day and str(day) == str(now.day) and now.month == month and now.year == year:
                output += macro.formatter.table_cell(1, {'class' : 'calendar-today'})
            elif not day:
                output += macro.formatter.table_cell(1, {'class': 'calendar-empty'})
            elif i in [5,6]:
                output += macro.formatter.table_cell(1, {'class': 'calendar-weekend'})
            else:
                output += macro.formatter.table_cell(1, {'class': 'calendar-day'})
            timestamp = u'%04d-%02d-%02d' % (year, month, day)
            if day:
                urldict = dict(pagename = request.page.page_name, action = action, date = timestamp, categories = categories)
                url = macro.request.getQualifiedURL() + '/' + '%(pagename)s?action=%(action)s&date=%(date)s&categories=%(categories)s' % urldict
                output += macro.formatter.url(1, url, u'metamonthcalendar_noentry_url')
                output += macro.formatter.text(u'%d' % day)
                output += macro.formatter.url(0)
            output += macro.formatter.table_cell(0)
        output += macro.formatter.table_row(1)
    output += macro.formatter.table_row(0)
    output += macro.formatter.table(0)


    return output
