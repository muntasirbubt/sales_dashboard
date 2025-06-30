from odoo import http
from odoo.http import request

class DashboardController(http.Controller):
    @http.route('/sales_dashboard/data', type='json', auth='user')
    def get_data(self, start_date, end_date, **kwargs):
        record = request.env['sales.dashboard'].get_dashboard_data(start_date, end_date)
        return record