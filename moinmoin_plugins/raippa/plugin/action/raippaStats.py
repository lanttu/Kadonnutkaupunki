import time
import datetime 

from MoinMoin.Page import Page
from MoinMoin import wikiutil

from graphingwiki.editing import get_metas

from raippa import RaippaUser
from raippa import Question
from raippa import raippacategories, removelink, getcourseusers, getflow

def _enter_page(request, pagename):
    request.theme.send_title(pagename)
    if not hasattr(request, 'formatter'):
        formatter = HtmlFormatter(request)
    else:
        formatter = request.formatter
    request.page.formatter = formatter
    request.write(request.page.formatter.startContent("content"))

def _exit_page(request, pagename):
    request.write(request.page.formatter.endContent())
    request.theme.send_footer(pagename)

def draw_taskstats(request, task, course, user=None):
    currentuser = RaippaUser(request, request.user.name)
    isteacher = currentuser.isTeacher()

    metas = get_metas(request, task, ["title", "description"], display=True, checkAccess=False)
    if metas["title"]:
        title = metas["title"].pop()
    else:
        title = unicode()
        reporterror(request, "%s doesn't have title meta." % task)

    html = unicode()
    if isteacher:
        html += u'''
Page: <a href="%s/%s">%s</a> <a href="%s/%s?action=EditTask">[edit]</a>
<script type="text/javascript">

</script>
''' % (request.getBaseURL(), task, task, request.getBaseURL(), task)

    html += u'<h1>%s</h1>' % title

    if not user: 
        courseusers = getcourseusers(request, course)
    else:
        courseusers = list()

    taskflow = getflow(request, task)
    for taskpoint, questionpage in taskflow:
        question = Question(request, questionpage)
        html += "\n%s " % question.question

        if isteacher:
            html += u'<a href="%s/%s?action=EditQuestion">[edit]</a>' % (request.getBaseURL(), questionpage)

        if user:
            history = question.gethistory(user.user, course)
            if history:
                if history[0] not in ["False", "pending", "picked", "recap"]:
                    if history[4]:
                        html += u'''
<ul><li>Passed with %d tries, in time %s.</li></ul>
''' % (Page(request, history[3]).get_real_rev(), history[4])
                    else:
                        html += u'''
<ul><li>Passed with %d tries.</li></ul>
''' % (Page(request, history[3]).get_real_rev())
            else:
                html += u'<ul><li>No answers for this question.</li></ul>'

        else:
            th_html = unicode()
            td_html = unicode()
            html = u'''<script type="text/javascript"
    src="%s/raippajs/mootools-1.2-core-yc.js"></script>
    <script type="text/javascript">
    function toggle(el){
        var part_list = $(el).getParent('p').getNext('div');
        part_list.toggleClass('hidden');
        if(el.get('text') == 'hide'){
            el.set('text', 'show');
        }else{
            el.set('text', 'hide');    
        }
    }
    </script>
    '''% request.cfg.url_prefix_static 
            histories = question.gethistories(coursefilter=course, taskfilter=taskpoint)
            users = list()
            passed = {True: list(), False: list()}
            try_count = float()
            total_time = float()
           
            for history in histories:
                h_users = history[0]
                overallvalue = history[1]
                historypage = history[5]
                for h_user in h_users:
                    if h_user not in users:
                        users.append(h_user)
               
                        if overallvalue not in ["False", "pending", "picked", "recap"]:
                            passed[True].append(h_user)
                        else:
                            passed[False].append(h_user)

                        try_count += Page(request, historypage).get_real_rev()

                        if history[6]:
                            t = time.strptime(history[6], "%H:%M:%S")
                            total_time += datetime.timedelta(hours=t[3], minutes=t[4], seconds=t[5]).seconds

            if len(users) > 0:
                average_tries = try_count/len(users)

                average_try_time = int("%.f" % (total_time/average_tries))
                iso_try_time = time.strftime("%H:%M:%S", time.gmtime(average_try_time)) 

                average_time = int("%.f" % (average_tries*average_try_time))
                iso_time = time.strftime("%H:%M:%S", time.gmtime(average_time))
                
                th_html += u'<th>Average tries:</th><th>Time per try:</th><th>Time per question:</th>'
                td_html += u'''<td>%.2f</td><td>%s</td><td>%s</td>''' % (average_tries, iso_try_time, iso_time)

                if len(passed[True]) > 0:
                    th_html += u'<th>Users who have passed this question:</th>'
                    td_html += u'''<td><p><span style="float:left;">%s /
               <b>%s</b></span><span style="float:right;margin-left:5px;"><a class="jslink" 
               onclick="toggle(this);">show</a></span><br
               clear="all"></p><div class="hidden">\n''' % (len(passed[True]), len(courseusers))
                    
                    for p_user in passed[True]:
                        meta = get_metas(request, p_user, ["name"], checkAccess=False)
                        if meta["name"]:
                            p_username = u'%s - %s' % (p_user, meta["name"].pop())
                        else:
                            p_username = p_user
                        td_html += u'''<a href="%s/%s?action=raippaStats&course=%s&task=%s&user=%s">%s</a><br>
''' % (request.getBaseURL(), request.page.page_name, course, task, p_user, p_username)
                    td_html += u'</div>\n'

                if len(passed[False]) > 0:
                    th_html += u'<th>Users who haven\'t passed this question:</th>' 
                    td_html += u'''<td><p><span style="float:left;">%s /
               <b>%s</b></span><span style="float:right;margin-left:5px;"><a class="jslink" 
               onclick="toggle(this);">show</a></span><br
               clear="all"></p><div class="hidden">\n''' % (len(passed[False]), len(courseusers))
                    

                    for p_user in passed[False]:
                        meta = get_metas(request, p_user, ["name"], checkAccess=False)
                        if meta["name"]:
                            p_username = u'%s - %s' % (p_user, meta["name"].pop())
                        else:
                            p_username = p_user
                        td_html += u'''<a href="%s/%s?action=raippaStats&course=%s&task=%s&user=%s">%s</a><br>
''' % (request.getBaseURL(), request.page.page_name, course, task, p_user, p_username)
                    td_html += u'</div>\n'
            else:
                th_html += u'<th>No answers for this question.</th>'
            html += u'<table><thead><tr>%s</tr></thead><tbody><tr>%s</tr></tbody></table' % (th_html, td_html)

    return html

def execute(pagename, request):

    if not request.user.name:
        _enter_page(request, pagename)
        request.write(u'<a href="?action=login">Login</a> or <a href="/UserPreferences">create user account</a>.')
        _exit_page(request, pagename)
        return None

    coursepage = request.form.get("course", [None])[0]
    username = request.form.get("user", [None])[0]
    taskpage = request.form.get("task", [None])[0]
    if request.form.has_key("compress"):
        compress = True
    else:
        compress = False

    currentuser = RaippaUser(request, request.user.name)
    if username and username != "none":
        if username != currentuser.user and not currentuser.isTeacher():
            _enter_page(request, pagename)
            request.write(u'You are not allowed to view users (%s) statistics.' % username)
            _exit_page(request, pagename)
            return None
        else:
            user = RaippaUser(request, username)
    else:
        if currentuser.isTeacher():
            user = None
        else:
            user = RaippaUser(request, request.user.name)
        
    getcourses = wikiutil.importPlugin(request.cfg, "macro", 'RaippaStats', 'getcourses')
    courses = getcourses(request, user)

    draw_ui = wikiutil.importPlugin(request.cfg, "macro", 'RaippaStats', 'draw_ui')
    if user and len(courses) < 1:
        html = draw_ui(request, courses, user=user, compress=compres)
        html += u'User %s not in any course.<br>\n' % (user.user)
    elif not user and len(courses) < 1:
        html = draw_ui(request, courses, compress=compress)
        html += u'No courses in Raippa.<br>\n'
    else:
        if coursepage:
            if not Page(request, coursepage).exists():
                message = u'%s does not exist.' % coursepage
                Page(request, pagename).send_page(msg=message)
                return None

            metas = get_metas(request, coursepage, ["gwikicategory"], display=True, checkAccess=False)
            if raippacategories["coursecategory"] not in metas["gwikicategory"]:
                message = u'%s is not coursepage.' % coursepage
                Page(request, pagename).send_page(msg=message)
                return None
        else:
            coursepage = courses.keys()[0]

        draw_stats = wikiutil.importPlugin(request.cfg, "macro", 'RaippaStats', 'draw_coursestats')
        if user:
            if taskpage:
                html = draw_ui(request, courses, coursepage, user, show_compress=False)
                html += draw_taskstats(request, taskpage, coursepage, user)
            else:
                html = draw_ui(request, courses, coursepage, user, compress=compress)
                html += draw_stats(request, coursepage, user, compress)
        else:
            html = draw_ui(request, courses, coursepage, compress=compress)
            if taskpage:
                html = draw_ui(request, courses, coursepage, show_compress=False)
                html += draw_taskstats(request, taskpage, coursepage)
            else:
                html = draw_ui(request, courses, coursepage, compress=compress)
                html += u'''
<table border="1">
<tr>
  <td>%s</td>
  <td id="stat_td"></td>
</tr>
</table>
''' % (draw_stats(request, coursepage, compress=compress))

    _enter_page(request, pagename)
    request.write(html)
    _exit_page(request, pagename)
