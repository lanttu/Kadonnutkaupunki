# -*- coding: iso-8859-1 -*-
import os
import random
import time

from MoinMoin.Page import Page
import MoinMoin.wikiutil as wikiutil
from MoinMoin.formatter.text_html import Formatter

from graphingwiki.editing import get_metas
from graphingwiki.editing import set_metas
from graphingwiki.editing import list_attachments

from raippa import RaippaUser
from raippa import Question
from raippa import raippacategories
from raippa import addlink, removelink, pageexists, getflow, reporterror

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

def gettip(request, tiplist):
    tip = "generic"
    while len(tiplist) > 0:
        tippage = random.sample(tiplist, 1)[0]
        if pageexists(request, tippage):
            meta = get_metas(request, tippage, ["tip"], checkAccess=False)
            if meta["tip"]:
                tip = meta["tip"].pop()
            break
        else:
            tiplist.remove(tippage)
    return tip

def drawtip(request, tip):
    if tip == "generic":
        tip = u'Your answer was incorrect.'
    elif tip == "checkboxgeneric":
        tip = u"Your answer was incorrect or you didn't select all the correct answers."
    elif tip == "noanswer":
        tip = u'You should answer all the questions.'
    elif tip == "recap":
        tip = u'Your answer was incorrect. Here is some material to help you out.'
    elif tip == "endrecap":
        tip = u'Congratulations for passing the recap task.'

    request.write(u'<pre>\n%s\n</pre>' % tip)

def drawquestion(request, question, taskpoint, course, ruser=False, recap=None):
    _ = request.getText
    wr = request.write

    if ruser and ruser.isTeacher():
        wr(u'<a href="%s/%s?action=EditQuestion">[edit question]</a>\n'% (request.getBaseURL(), question.pagename))

    wr(u'<h2>%s</h2>\n' % question.question)

    if pageexists(request, question.note):
        formatter = Formatter(request, store_pagelinks=1)
        formatter.page = Page(request, question.note)
        body = Page(request, question.note).getPageText()
        Page(request, question.note, formatter=formatter).send_page_content(request, body)
    else:
        wr(question.note)

    images = list_attachments(request, question.pagename)
    if images:
        wr(u'Files: ')
        for image in images:
            image_url = u'%s/%s?action=getAttachment&target=%s' % (request.getBaseURL(), question.pagename, image)
            wr(u'<a href="%s" target="_blank">%s </a>\n' % (image_url, image))
    wr(u'<br>\n')

    #history = ruser.gethistory(question.pagename, course)
    history = question.gethistory(ruser.user, course)

    if history:
        overallvalue = history[0]
        historypage = history[3]
        meta = get_metas(request, historypage, ["comment"], display=True, checkAccess=False)
        if meta["comment"]:
            commentpage = meta["comment"].pop()
            if not pageexists(request, commentpage):
                pass
                #TODO: handle missing commentpage
        else:
            commentpage = None

        wr(u'<hr>\n')
        if question.answertype == "file":
            if overallvalue not in ["pending", "picked", "False"]:
                wr(u'<strong>You got %s right! Click Continue or submit new file.</strong><br>\n' % overallvalue)
                if commentpage: 
                    drawcomment(request, commentpage)
                #TODO: parents are evil
                temp = taskpoint.split("/")
                temp.pop()
                taskpage = "/".join(temp)

                wr(u'<form method="POST" enctype="multipart/form-data" action="%s">\n' % request.page.page_name.split("/")[-1])
                wr(u'<input type="hidden" name="action" value="flowRider">\n')
                wr(u'<input type="hidden" name="select" value="%s">\n' % taskpage)
                wr(u'<input type="hidden" name="course" value="%s">\n' % course)
                if recap:
                    wr(u'<input type="hidden" name="recap" value="%s">\n' % recap)
                wr(u'<input type="submit" name="continue" value="Continue">\n')
                wr(u'</form>\n')
            elif overallvalue == "pending":
                wr(u'<strong>Your answer to this question is being processed. As soon as it has been checked, the result will be posted here. You may return new answer to replace the old one, if you so please. <strong><br>\n')
                if commentpage:
                    drawcomment(request, commentpage)
                #TODO: parents are evil
                temp = taskpoint.split("/")
                temp.pop()
                taskpage = "/".join(temp)
                wr(u'<form method="POST" enctype="multipart/form-data" action="%s">\n' % request.page.page_name.split("/")[-1])
                wr(u'<input type="hidden" name="action" value="flowRider">\n')
                wr(u'<input type="hidden" name="select" value="%s">\n' % taskpage)
                wr(u'<input type="hidden" name="course" value="%s">\n' % course)
                if recap:
                    wr(u'<input type="hidden" name="recap" value="%s">\n' % recap)
                wr(u'<input type="submit" name="continue" value="Continue">\n')
                wr(u'</form>\n')
            elif overallvalue == "False":
                wr(u'<strong>You have answered this question and your answer was incorrect. Please try again.</strong><br>\n')
                if commentpage:
                    drawcomment(request, commentpage)
        else:
            if commentpage:
                drawcomment(request, commentpage)

    wr(u'<br>\n')

def drawanswerinput(request, question):
    wr = request.write
    id = 0
    if question.answertype == "radio":
        answerlist = question.getanswers().keys()
        random.shuffle(answerlist)

        for answer in answerlist:
            id += 1
            wr(u'<input type="radio" name="answer" id="ans%s" value="%s">\n' % (id, answer.replace('"','&quot;')))
            wr(u'<label for="ans%s">%s</label><br>\n' % (id, answer))
    
    elif question.answertype == "checkbox":
        answerlist = question.getanswers().keys()
        random.shuffle(answerlist)

        for answer in answerlist:
            id += 1
            wr(u'<input type="checkbox" id="ans%s" name="answer" value="%s">\n' % (id, answer.replace('"','&quot;')))
            wr(u'<label for="ans%s">%s</label><br>\n' % (id, answer))

    elif question.answertype == "file":
        wr(u'<input type="file" name="answer">\n')

    else:
        wr(u'<input type="text" name="answer" size="50">\n')

    wr(u'<hr>\n')

def drawcomment(request, commentpage):
    formatter = Formatter(request, store_pagelinks=1)
    formatter.page = Page(request, commentpage)
    body = Page(request, commentpage).getPageText()
    request.write(u'<strong>Comment:</strong>')
    Page(request, commentpage, formatter=formatter).send_page_content(request, body)

def drawtaskpointpage(request, questionpage, taskpoint, course, ruser=False, recap=None):
    _ = request.getText
    wr = request.write

    try:
        question = Question(request, questionpage)
    except Exception, inst:
        exceptionargs = "".join(inst.args)
        reporterror(request, exceptionargs)
        drawerrormessage(request)
        return None

    if question.answertype == "file":
        #history = ruser.gethistory(question.pagename, course)
        history = question.gethistory(ruser.user, course)
        if history:
            overallvalue = history[0]
            if overallvalue == "picked":  #in ["pending", "picked"]:
                wr(u'You have already answered this question. Waiting for your answer to be checked.\n')
                return None

    drawquestion(request, question, taskpoint, course, ruser, recap)
    wr(u'<form method="POST" enctype="multipart/form-data" action="%s">\n' % request.page.page_name.split("/")[-1])
    wr(u'<input type="hidden" name="action" value="flowRider">\n')
    wr(u'<input type="hidden" name="current" value="%s">\n' % taskpoint)
    wr(u'<input type="hidden" name="course" value="%s">\n' % course)
    wr(u'<input type="hidden" name="stime" value="%s">\n' % time.time())
    if recap:
        wr(u'<input type="hidden" name="recap" value="%s">\n' % recap)
    drawanswerinput(request, question)
    wr(u'<input type="submit" name="check" value="Submit">\n')
    wr(u'</form>\n')

def drawtaskpage(request, taskpage, course, ruser=False, recap=None):
    _ = request.getText

    if not pageexists(request, taskpage):
        message = _(u'The page %s does not exist.') % taskpage
        Page(request, request.page.page_name).send_page(content_only=1, msg=message)
        return None

    keys = ["type", "title", "description"]
    metas = get_metas(request, taskpage, keys, checkAccess=False)

    if metas["type"]:
        tasktype = metas["type"].pop()
    else:
        reporterror(request, "%s doesn't have type. Using type \"basic\"." % taskpage)
        tasktype = "basic"

    if metas["title"]:
        title = metas["title"].pop()
    else:
        reporterror(request, "%s doesn't have title." % taskpage)
        title = u'TITLE MISSING!'

    if metas["description"]:
        description = metas["description"].pop()
    else:
        reporterror(request, "%s doesn't have description." % taskpage)
        description = u'DESCRIPTION MISSING!'
    
    wr = request.write
    html = unicode()
    editlink = False
    if ruser and ruser.isTeacher():
        editlink = True
        html += u'<a href="%s/%s?action=EditTask">[edit task]</a><br>\n' % (request.getBaseURL(), taskpage)

    html += u'<h1>%s</h1>\n' % title
    html += u'%s<br>\n' % description

    #TODO: option random goes here
    #TODO: handle getlflow errors
    taskflow = getflow(request, taskpage)
    url = u'%s/%s?action=flowRider&course=%s' % (request.getBaseURL(), request.page.page_name, course)
    html += u'Questions:\n'
    html += u'<ul>\n'
    index = -1
    for taskpointpage, questionpage in taskflow:
        index += 1
        try:
            question = Question(request, questionpage)
        except Exception, inst:
            exceptionargs = "".join(inst.args)
            reporterror(request, exceptionargs)
            drawerrormessage(request)
            return None

        html += u'<li>%s ' % question.question
        if recap:
            historypage = recap
            meta = get_metas(request, historypage, ["recap"], display=True, checkAccess=False)
            if meta["recap"]:
                recaptask = meta["recap"].pop()
            else:
                #TODO: handle missin recap link
                pass

            #start of recap
            if recaptask == taskpage and index == 0:
                html += u'<a href="%s&recap=%s&select=%s">select</a>' % (url, historypage, taskpointpage)
            else:
                if recaptask == taskpointpage:
                        html += u'<a href="%s&recap=%s&select=%s">select</a>' % (url, historypage, taskpointpage)
        else:
            try:
                may, reason = ruser.canDo(taskpointpage, course)
            except Exception, inst:
                exceptionargs = "".join(inst.args)
                reporterror(request, exceptionargs)
                drawerrormessage(request)
                return None

#            history = question.gethistory(ruser.user, course)
#            commentpage = None
#            if history:
#                historypage = history[3]
#                comments = get_metas(request, historypage, ["comment"], display=True, checkAccess=False)
#                if comments["comment"]:
#                    commentpage = comments["comment"].pop() 

            if may:
                if reason == "redo":
                    html += u'<a href="%s&select=%s">redo</a>' % (url, taskpointpage)
                elif reason == "pending":
                    html += u'<a href="%s&select=%s">redo</a>' % (url, taskpointpage)
                else:
                    html += u'<a href="%s&select=%s">select</a>' % (url, taskpointpage)
            else:
                if reason == "picked": #in ["pending", "picked"]:
                    html += u'picked for checking'
                elif reason == "recap":
                    history = question.gethistory(ruser.user, course)
                    if history:
                        historypage = history[3]
                        html += u'<a href="%s&recap=%s">recap</a>' % (url, historypage)
                    else:
                        #TODO: handle missing history
                        pass
                elif reason == "done":
                    html += u'done'

            if editlink:
                html += u' <a href="%s/%s?action=EditQuestion">[edit]</a>' % (request.getBaseURL(), questionpage)
        html += u'</li>\n'
    html += u'</ul>\n'
    wr(html)

def drawerrormessage(request, message=None):
    if not message:
        message = u'''
<h2>An Error Has Occurred</h2>
Error is reported to the admins. Please come back later.'''

    request.write(message)

def drawpage(request, page, course, ruser, recap=None):
    _ = request.getText
    pagename = request.page.page_name

    if not pageexists(request, page):
        message = u'The page %s does not exist.' % page 
        Page(request, pagename).send_page(content_only=1, msg=message)
        return None

    keys = ["gwikicategory", "task", "question"]
    metas = get_metas(request, page, keys, display=True, checkAccess=False)

    categories = metas["gwikicategory"]
    if raippacategories["coursepointcategory"] in categories:
        if metas["task"]:
            taskpage = metas["task"].pop()
            drawtaskpage(request, taskpage, course, ruser, recap)
        else:
            #TODO: handle missing link
            message = u'Link to task does not exist.'
            Page(request, pagename).send_page(content_only=1, msg=message)

    elif raippacategories["taskcategory"] in categories:
        drawtaskpage(request, page, course, ruser, recap)

    elif raippacategories["taskpointcategory"] in categories:
        if metas["question"]:
            questionpage = metas["question"].pop()
            drawtaskpointpage(request, questionpage, page, course, ruser, recap)
        else:
            #TODO: handle missing link
            message = u'Link to question does not exist.'
            Page(request, pagename).send_page(content_only=1, msg=message)
    else:
        #TODO: handle missing category
        message = u'Invalid page category.'
        Page(request, pagename).send_page(content_only=1, msg=message)

def execute(pagename, request):
    _ = request.getText

    if not request.user.name:
        _enter_page(request, pagename)
        request.write(u'<a href="?action=login">Login</a> or <a href="/UserPreferences">create user account</a>.')
        _exit_page(request, pagename)
        return None

    coursepage = request.form.get("course", [unicode()])[0]
    if not pageexists(request, coursepage):
        message = u'The page %s does not exist.' % coursepage
        Page(request, pagename).send_page(msg=message)
        return None

    ruser = RaippaUser(request)

    #check if user is quarantined
    if ruser.isQuarantined():
        message = _(u'You have been quarantined. Please come back later.')
        Page(request, pagename).send_page(msg=message)
        return None

    #draw selected page
    if request.form.has_key("select"):
        selectedpage = request.form.get("select", [unicode()])[0]
        recaphistory = request.form.get("recap", [unicode()])[0]

        #TODO: better access handling?
        if recaphistory:
            may = True
        else:
            #TODO: get parent and check tasktype
            categories = get_metas(request, selectedpage, ["gwikicategory"], checkAccess=False)
            if raippacategories["coursepointcategory"] in categories["gwikicategory"]:
                metas = get_metas(request, selectedpage, ["task"], display=True,checkAccess=False)
                if metas["task"]:
                    taskpage = metas["task"].pop()
                else:
                    pass
                    #TODO: handle missing task link
            elif raippacategories["taskcategory"] in categories["gwikicategory"]:
                taskpage = selectedpage
            elif raippacategories["taskpointcategory"] in categories["gwikicategory"]:
                temp = selectedpage.split("/")
                temp.pop()
                taskpage = "/".join(temp)
            else:
                pass
                #TODO: handle missing category

            metas = get_metas(request, taskpage, ["type"], checkAccess=False)
            if metas["type"]:
                tasktype = metas["type"].pop()
            else:
                tasktype = "basic"
                #TODO: handle missing tasktype link

            try:
                if tasktype == "exam" or tasktype == "questionary":
                    may, reason = ruser.canDo(taskpage, coursepage)
                else:
                    may, reason = ruser.canDo(selectedpage, coursepage)
            except Exception, inst:
                exceptionargs = "".join(inst.args)
                reporterror(request, exceptionargs)
                drawerrormessage(request)
                return None

        _enter_page(request, pagename)
        if may:
            drawpage(request, selectedpage, coursepage, ruser, recaphistory)
        else:
            request.write(u'You are not allowed to do this task.')
        _exit_page(request, pagename)

    #check answers
    elif request.form.has_key("check") and request.form.has_key("current"):
        recaphistory = request.form.get("recap", [unicode()])[0]
        currentpage = request.form.get("current", [unicode()])[0]
        
        if not pageexists(request, currentpage):
            message = u'The page %s does not exist.' % currentpage
            Page(request, pagename).send_page(msg=message)
            return None

        categories = get_metas(request, currentpage, ["gwikicategory"], checkAccess=False)
        if raippacategories["coursepointcategory"] in categories["gwikicategory"]:
            metas = get_metas(request, currentpage, ["task"], display=True, checkAccess=False)
            if metas["task"]:
                taskpage = metas["task"].pop()
            else:
                pass
                #TODO: handle missing task link
        elif raippacategories["taskcategory"] in categories["gwikicategory"]:
            taskpage = currentpage
        elif raippacategories["taskpointcategory"] in categories["gwikicategory"]:
            temp = currentpage.split("/")
            temp.pop()
            taskpage = "/".join(temp)
        else:
            pass
            #TODO: handle missing category

        metas = get_metas(request, taskpage, ["type"], checkAccess=False)
        if metas["type"]:
            tasktype = metas["type"].pop()
        else: 
            tasktype = "basic"
            #TODO: handle missing tasktype link

        if not recaphistory:
            try:
                if tasktype == "exam" or tasktype == "questionary":
                    may, reason = ruser.canDo(taskpage, coursepage)
                else:
                    may, reason = ruser.canDo(currentpage, coursepage)
            except Exception, inst:
                exceptionargs = "".join(inst.args)
                reporterror(request, exceptionargs)
                _enter_page(request, pagename)
                drawerrormessage(request)
                _exit_page(request, pagename)
                return None

            if not may:
                _enter_page(request, pagename)
                request.write(u'You are not allowed to do this question.')
                _exit_page(request, pagename)
                return None

        #check and write answers
        metas = get_metas(request, currentpage, ["question"], display=True, checkAccess=False)
        if metas["question"]:
            questionpage = metas["question"].pop()
            try:
                question = Question(request, questionpage)
            except Exception, inst:
                exceptionargs = "".join(inst.args)
                reporterror(request, exceptionargs)
                _enter_page(request, pagename)
                drawerrormessage(request)
                _exit_page(request, pagename)
                return None
        else:
            reporterror(request, u"Page %s doesn't have question link." % currentpage)
            _enter_page(request, pagename)
            drawerrormessage(request)
            _exit_page(request, pagename)
            return None

        #check user is in a group
        userpage = request.graphdata.getpage(ruser.user)
        linking_in = userpage.get('in', {})
        pagelist = linking_in.get("user", [])
        users = list()
        for page in pagelist:
            if page.startswith(coursepage) and page.endswith("Group"):
                raw = Page(request, page).getPageText()
                for line in raw.split("\n"):
                    if line.startswith(" * "):
                        user_in_line = removelink(line[3:].rstrip())
                        users.append(user_in_line)
                #user can be only in one group/course
                break
        else:
            users = [ruser.user]

        question = Question(request, questionpage)
        if question.answertype == "file":
            if not question.writehistory(users, coursepage, currentpage, "pending",{},file=True):
                #TODO: should be message?
                request.write(u'Answer writing failed.')
                return None

            _enter_page(request, pagename)
            drawpage(request, currentpage, coursepage, ruser)
            _exit_page(request, pagename)
            return None
        else:
            useranswer = request.form.get("answer", list())

            utime = 0.0
            try:
                start_time = float(request.form.get("stime", [None])[0])
                if start_time:
                    current_time = time.time()
                    utime = current_time - start_time
                    if utime > 1800:
                        utime = 1800
            except:
                pass

            if tasktype != "exam" and not useranswer:
                _enter_page(request, pagename)
                drawtip(request, "noanswer") 
                drawpage(request, currentpage, coursepage, ruser)
                _exit_page(request, pagename)
                return None
            overall, success, tips = question.checkanswers(useranswer)
            if overall:
                #TODO: if positive tip, show it and continuebutton
                if recaphistory:
                    #TODO: if pages are not found reset recap
                    metas = get_metas(request, currentpage, ["next"], display=True, checkAccess=False)
                    if metas["next"]:
                        next = metas["next"].pop()
                        if next != "end" and pageexists(request, next):
                            newmetas = {recaphistory: {"recap":[next]}}
                            remove = {recaphistory: ["recap"]}

                            #TODO: check write success
                            success, msg = set_metas(request, remove, dict(), newmetas)

                            #TODO: parents are evil
                            temp = currentpage.split("/")
                            temp.pop()
                            taskpage = "/".join(temp)

                            _enter_page(request, pagename)
                            drawpage(request, taskpage, coursepage, ruser, recaphistory)
                            _exit_page(request, pagename)
                        elif next == "end":
                            remove = {recaphistory: ["recap", "overallvalue"]}
                            newmetas = {recaphistory: {"overallvalue":["False"]}}
                                    
                            #TODO: check write success
                            success, msg = set_metas(request, remove, dict(), newmetas)

                            metas = get_metas(request, recaphistory, ["task"], display=True, checkAccess=False)
                            if metas["task"]:
                                taskpage = metas["task"].pop()
                                temp = taskpage.split("/")
                                temp.pop()
                                taskpage = "/".join(temp)

                                _enter_page(request, pagename)
                                drawpage(request, taskpage, coursepage, ruser)
                                _exit_page(request, pagename)
                            else:
                                pass
                                #TODO: handle missing task link
                        else:
                            #TODO:handle missing page
                            pass
                    else:
                        #TODO:handle missing link
                        pass

                else:
                    if not question.writehistory(users, coursepage, currentpage, overall,success, usedtime=utime):
                        #TODO: should be message?
                        request.write(u'Answer writing failed.')
                        return None

                    try:
                        done, info = ruser.hasDone(taskpage, coursepage)
                    except Exception, inst:
                        exceptionargs = "".join(inst.args)
                        reporterror(request, exceptionargs)
                        _enter_page(request, pagename)
                        drawerrormessage(request)
                        _exit_page(request, pagename)
                        return None
                    if done:
                        message = u'Congratulations! You have passed the task.'
                        Page(request, pagename).send_page(msg=message)
                        return None
                    else:
                        _enter_page(request, pagename)
                        drawpage(request, taskpage, coursepage, ruser)
                        _exit_page(request, pagename)
                        return None
            else:
                #save and look for possible recap
                if not recaphistory:
                    metas = get_metas(request, currentpage, ["recap"], display=True, checkAccess=False)
                    if metas["recap"]:
                        recappage = metas["recap"].pop()
                        if pageexists(request, recappage):
                            historypage = question.writehistory(users, coursepage, currentpage, "recap", success)
                            if not historypage:
                                #TODO: should be message?
                                request.write(u'Answer writing failed.')
                                return None

                            _enter_page(request, pagename)
                            drawtip(request, "recap")
                            drawpage(request,  recappage, coursepage, ruser, historypage)
                            _exit_page(request, pagename)
                            return None
                        else:
                            return None
                            #TODO: report missing recappage
                    else:
                        #if no recap found, just save
                        succ = question.writehistory(users, coursepage, currentpage, overall, success, usedtime=utime)
                        if not succ:
                            #TODO: should be message?
                            request.write(u'Answer writing failed.')
                            return None
                _enter_page(request, pagename)
                if tasktype == "exam" or tasktype == "questionary":
                    drawpage(request, taskpage, coursepage, ruser)
                else:
                    if tips:
                        tip = gettip(request, tips)
                        drawtip(request, tip)
                    elif question.answertype == "checkbox":
                        drawtip(request, "checkboxgeneric")
                    else:
                        drawtip(request, "generic")
                    drawpage(request, currentpage, coursepage, ruser, recaphistory)
                _exit_page(request, pagename)
                return None

    #get recap task and draw it
    elif request.form.has_key("recap"):
        historypage = request.form.get("recap", [unicode()])[0]
        if not pageexists(request, historypage):
            #TODO: missing history, no recap 
            #reset recap and -> pagename
            return None

        metas = get_metas(request, historypage, ["recap"], display=True, checkAccess=False)
        if metas["recap"]:
            recappage = metas["recap"].pop()
            if not pageexists(request, recappage):
                #TODO: shoul handle this somehow
                return None
        else:
            return None
            #TODO: if pages are not found, display no recap message

        meta = get_metas(request, recappage, ["gwikicategory"], checkAccess=False)
        categories = meta["gwikicategory"] 

        if raippacategories["taskpointcategory"] in categories:
            #TODO: parents are evil
            temp = recappage.split("/")
            temp.pop()
            recappage = "/".join(temp)
        elif raippacategories["taskcategory"] not in categories:
            #TODO: handle invalid category
            return None
        
        _enter_page(request, pagename)
        drawtip(request, "recap")
        drawpage(request,  recappage, coursepage, ruser, historypage)
        _exit_page(request, pagename)

