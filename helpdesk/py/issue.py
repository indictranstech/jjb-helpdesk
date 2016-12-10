import frappe
from helpdesk.utils import send_mail, build_table

@frappe.whitelist(allow_guest=True)
def get_subject_and_department_list():
	return {
		# "departments": frappe.db.get_all("Department", fields="name as department"),
		"service_type": frappe.db.get_all("Service Type", fields="name as service_type")
		# "categories": frappe.db.get_all("Service Type", fields="name as service_type")
	}

@frappe.whitelist(allow_guest=True)
# def raise_issue(raised_by, department, description, subject):
def raise_issue(**args):
	import json
	import HTMLParser

	args = frappe._dict(args)
	
	issue = frappe.new_doc("Issue")
	issue.raised_by = args.raised_by
	issue.facility = HTMLParser.HTMLParser().unescape(args.facility)
	issue.description = HTMLParser.HTMLParser().unescape(args.description)
	issue.service_type = HTMLParser.HTMLParser().unescape(args.service_type)
	issue.location = HTMLParser.HTMLParser().unescape(args.location)
	issue.building = HTMLParser.HTMLParser().unescape(args.building)
	issue.floor = HTMLParser.HTMLParser().unescape(args.floor)
	issue.area = HTMLParser.HTMLParser().unescape(args.area)
	issue.city = HTMLParser.HTMLParser().unescape(args.city)
	# #write 
	# issue.loc_desc = HTMLParser.HTMLParser().unescape(args.loc_desc)
	# issue.subject = HTMLParser.HTMLParser().unescape(args.subject)

	issue.save(ignore_permissions=True)
	return issue.names

def validate(doc, method):
	if doc.prev_status != doc.status and doc.status == "Closed":
		doc.prev_status = doc.status
		# send mail to user
		ticket = {
			"total":6,
			1:["Ticket ID", doc.name],
			2:["Branch", doc.branch],
			3:["Category", doc.department],
			4:["Opening Date", doc.opening_date],
			5:["Opeing Time", doc.opening_time],
			6:["Question", doc.question],
			7:["Raised By", doc.raised_by]
		}
		args = {
			"email": doc.raised_by,
			"user": doc.raised_by,
			"issue": doc.name,
			"action": "ticket_closed",
			"ticket_detail": build_table(ticket, is_horizontal=True)
		}
		send_mail(args, "[HelpDesk][Ticket Closed] HelpDesk Notifications")
	else:
		doc.prev_status = doc.status

	if doc.resolution_details != doc.old_resolution_details:
		comment = "<div class='media-content-wrapper' style='padding-left:35px'><div class='reply small'>\
		Status : {status}<br>Old Resolution Details: {old_resolution_details}<br>\
		Resolution Details: {resolution_details}</div></div>".format(
			status=doc.status,
			old_resolution_details=doc.old_resolution_details,
			resolution_details=doc.resolution_details
		)
		
		doc.add_comment("Email", comment)
		doc.old_resolution_details = doc.resolution_details

@frappe.whitelist()
def fetch_values(raised_email):
	branch = phone_number = {}
	branch = frappe.db.get_value("User", raised_email or frappe.session.user, ["department as branch", "mobile_number"], as_dict=True)
	if branch and branch.get("branch"):
		phone_number = frappe.db.get_value("Branch", branch.get("branch"), "phone_number", as_dict=True)

	branch.update(phone_number)
	frappe.errprint([branch])

	return branch or {}