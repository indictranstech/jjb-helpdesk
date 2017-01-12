import frappe

def get_branch_query(user):
	if not user: user = frappe.session.user

	if "System Manager" in frappe.get_roles(user):
		return None
	else:
		branch = frappe.db.get_value("User", user, "department")
		return """(tabBranch.name = '{branch}')""".format(branch=branch)

def get_issue_query(user):
	if not user: user = frappe.session.user

	roles = frappe.get_roles(user)

	if "System Manager" in roles:
		return None
	elif "Support Team" in roles:
		return """\
		 (tabIssue.owner = '{user}' or tabIssue.raised_by = '{user}')
		 or (tabIssue.name in (select tabToDo.reference_name from tabToDo where
		 	(tabToDo.owner = '{user}' or tabToDo.assigned_by = '{user}') and tabToDo.status in ('Open', 'Closed') 
		 	and tabToDo.reference_type = 'Issue' and tabToDo.reference_name=tabIssue.name))\
		 """.format(user=frappe.db.escape(user))
	elif "Branch Manager" in roles:
		branch = frappe.db.get_value("User", user, "department")

		return """\
		 (tabIssue.branch = '{branch}' or (tabIssue.owner = '{user}' or tabIssue.raised_by = '{user}'))
		 """.format(user=frappe.db.escape(user), branch=branch)

	elif "Branch User" in roles:
		branch = frappe.db.get_value("User", user, "department")

		return """\
		 (tabIssue.branch = '{branch}' and (tabIssue.owner = '{user}' or tabIssue.raised_by = '{user}'))
		 """.format(user=frappe.db.escape(user), branch=branch)
