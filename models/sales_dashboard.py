from odoo import models, fields, api

class SalesDashboard(models.TransientModel):
    _name = 'sales.dashboard'

    @api.model
    def get_dashboard_data(self, start_date, end_date):
        return {
            'best_selling_products': self._get_best_selling_products(start_date, end_date),
            'best_salespersons': self._get_best_salespersons(start_date, end_date),
            'best_salespersons_by_confirm_order': self._get_best_salespersons_confirmed_orders(start_date, end_date),
            'status_overview': self._get_status_overview(start_date, end_date),
            'payment_order_summary': self._get_payment_order_summary(start_date, end_date),
            'payment_summary': self._get_payment_summary(start_date, end_date),
            'day_wise_sales': self._get_day_wise_sales_amount(start_date, end_date),        }

    def _get_day_wise_sales_amount(self, start_date, end_date):
        """
        Get day-wise sales amount for the given date range
        Returns: List of dictionaries with date and total sales amount
        """
        query = """
            SELECT 
                DATE(so.date_order) as sale_date,
                SUM(so.amount_total) as total_amount
            FROM sale_order so
            WHERE so.date_order BETWEEN %s AND %s
                AND so.state IN ('sale', 'done')
            GROUP BY DATE(so.date_order)
            ORDER BY sale_date
        """

        self.env.cr.execute(query, (start_date, end_date))
        results = self.env.cr.dictfetchall()
        return results
    def _get_best_selling_products(self, start_date, end_date):
        record =  self.env['sale.order.line'].read_group(
            [('order_id.date_order', '>=', start_date),
             ('order_id.date_order', '<=', end_date),
             ('order_id.state', 'in', ['sale', 'done'])],
            ['product_id', 'qty_delivered'],
            ['product_id'],
            orderby='qty_delivered desc',
            limit=5
        )
        return record

    def _get_best_salespersons(self, start_date, end_date):
        record =  self.env['sale.order'].read_group(
            [('date_order', '>=', start_date),
             ('date_order', '<=', end_date),
             ('state', 'in', ['sale', 'done'])],
            ['user_id', 'amount_total'],
            ['user_id'],
            orderby='amount_total desc',
            limit=5
        )
        return record

    def _get_best_salespersons_confirmed_orders(self, start_date, end_date):
        record = self.env['sale.order'].read_group(
            [('date_order', '>=', start_date),
             ('date_order', '<=', end_date),
             ('state', 'in', ['sale'])],
            ['user_id'],
            ['user_id'],
            orderby='__count desc',  # Order by number of orders (confirmed)
            limit=5
        )
        return record

    def _get_status_overview(self, start_date, end_date):
        status_record =  self.env['sale.order'].read_group(
            [('date_order', '>=', start_date),
             ('date_order', '<=', end_date)],
            ['state'],
            ['state']
        )
        return status_record

    def _get_payment_order_summary(self, start_date, end_date):
        move_record = self.env['account.move'].search([
            ('invoice_date', '>=', start_date),
            ('invoice_date', '<=', end_date),
            ('move_type', '=', 'out_invoice'),
            ('state', '=', 'posted')
        ])
        payments = self.env['account.payment'].read_group(
            [('move_id', 'in', move_record.ids),
             ('payment_type', '=', 'inbound')],
            ['journal_id', 'amount:sum'],
            ['journal_id']
        )
        return payments

    def _get_payment_summary(self, start_date, end_date):
        record = self.env['account.move'].read_group(
            [('invoice_date', '>=', start_date),
             ('invoice_date', '<=', end_date),
             ('move_type', '=', 'out_invoice')],
            ['payment_state'],
            ['payment_state']
        )
        return record