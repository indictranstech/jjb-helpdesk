// TODO make department field reqd only if support user, support team, support manager, support Lead role selected
// frappe.ui.form.on("User", {
// 	onload: function(frm){
// 		inList(["Administrator", "Guest"], frm.doc.name)?false:cur_frm.toggle_reqd("department", true);
// 	},
// });

cur_frm.add_fetch("department", "phone_number", "phone_number")