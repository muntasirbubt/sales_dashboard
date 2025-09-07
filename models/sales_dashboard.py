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
            'day_wise_sales': self._get_day_wise_sales_amount(start_date, end_date),
            'top_customers': self._get_top_customers(start_date, end_date),
        }

    def _get_top_customers(self, start_date, end_date):
        query = """
            SELECT 
                so.partner_id,
                rp.name as customer_name,
                SUM(so.amount_total) as total_amount
            FROM sale_order so
            JOIN res_partner rp ON so.partner_id = rp.id
            WHERE so.date_order >= %s
                AND so.date_order <= %s
                AND so.state IN ('sale', 'done')
            GROUP BY so.partner_id, rp.name
            ORDER BY total_amount DESC
            LIMIT 5
        """

        self.env.cr.execute(query, (start_date, end_date))
        results = self.env.cr.dictfetchall()

        formatted_results = []
        for result in results:
            formatted_results.append({
                'partner_id': (result['partner_id'], result['customer_name']),
                'amount_total': result['total_amount']
            })

        return formatted_results


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
        query = """
            SELECT 
                pp.id as product_id,
                pt.name as product_name,
                COALESCE(SUM(sol.qty_delivered), 0) as total_qty_delivered
            FROM sale_order_line sol
            JOIN sale_order so ON sol.order_id = so.id
            JOIN product_product pp ON sol.product_id = pp.id
            JOIN product_template pt ON pp.product_tmpl_id = pt.id
            WHERE so.date_order >= %s
                AND so.date_order <= %s
                AND so.state IN ('sale', 'done')
            GROUP BY pp.id, pt.name
            ORDER BY total_qty_delivered DESC
            LIMIT 5
        """

        self.env.cr.execute(query, (start_date, end_date))
        results = self.env.cr.dictfetchall()

        # Format to match the original read_group structure
        formatted_results = []
        for result in results:
            formatted_results.append({
                'product_id': (result['product_id'], result['product_name'].get('en_US')),
                'qty_delivered': result['total_qty_delivered']
            })

        return formatted_results

    # def _get_best_salespersons(self, start_date, end_date):
    #     record =  self.env['sale.order'].read_group(
    #         [('date_order', '>=', start_date),
    #          ('date_order', '<=', end_date),
    #          ('state', 'in', ['sale', 'done'])],
    #         ['user_id', 'amount_total'],
    #         ['user_id'],
    #         orderby='amount_total desc',
    #         limit=5
    #     )
    #     return record

    def _get_best_salespersons(self, start_date, end_date):
        query = """
            SELECT
                so.user_id as user_id,
                rp.name as user_name,
                SUM(so.amount_total) as amount_total
            FROM
                sale_order so
            LEFT JOIN
                res_users ru ON so.user_id = ru.id
            LEFT JOIN
                res_partner rp ON ru.partner_id = rp.id
            WHERE
                so.date_order >= %s
                AND so.date_order <= %s
                AND so.state IN ('sale', 'done')
            GROUP BY
                so.user_id, rp.name
            ORDER BY
                amount_total DESC
            LIMIT 5
        """

        self.env.cr.execute(query, (start_date, end_date))
        results = self.env.cr.dictfetchall()

        # Format the results to match the original read_group structure
        formatted_results = []
        for record in results:
            formatted_results.append({
                'user_id': (record['user_id'], record['user_name']),
                'amount_total': record['amount_total']
            })

        return formatted_results

    def _get_best_salespersons_confirmed_orders(self, start_date, end_date):
        query = """
            SELECT
                so.user_id as id,
                rp.name as name,
                COUNT(so.id) as order_count
            FROM
                sale_order so
            LEFT JOIN
                res_users ru ON so.user_id = ru.id
            LEFT JOIN
                res_partner rp ON ru.partner_id = rp.id
            WHERE
                so.date_order >= %s
                AND so.date_order <= %s
                AND so.state = 'sale'
            GROUP BY
                so.user_id, rp.name
            ORDER BY
                order_count DESC
            LIMIT 5
        """

        self.env.cr.execute(query, (start_date, end_date))
        results = self.env.cr.dictfetchall()

        # Format the results to match the original read_group structure
        formatted_results = []
        for record in results:
            formatted_results.append({
                'user_id': (record['id'], record['name']),
                'user_id_count': record['order_count']
            })

        return formatted_results

    # def _get_status_overview(self, start_date, end_date):
    #     status_record =  self.env['sale.order'].read_group(
    #         [('date_order', '>=', start_date),
    #          ('date_order', '<=', end_date)],
    #         ['state'],
    #         ['state']
    #     )
    #     return status_record

    def _get_status_overview(self, start_date, end_date):
        query = """
            SELECT 
                state,
                COUNT(id) as state_count
            FROM 
                sale_order
            WHERE 
                date_order >= %s
                AND date_order <= %s
            GROUP BY 
                state
        """

        self.env.cr.execute(query, (start_date, end_date))
        results = self.env.cr.dictfetchall()

        # Format the results to match the original read_group structure
        formatted_results = []
        for record in results:
            formatted_results.append({
                'state': record['state'],
                'state_count': record['state_count']
            })

        return formatted_results

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

    # def _get_payment_summary(self, start_date, end_date):
    #     record = self.env['account.move'].read_group(
    #         [('invoice_date', '>=', start_date),
    #          ('invoice_date', '<=', end_date),
    #          ('move_type', '=', 'out_invoice')],
    #         ['payment_state'],
    #         ['payment_state']
    #     )
    #     return record

    def _get_payment_summary(self, start_date, end_date):
        query = """
            SELECT 
                payment_state,
                COUNT(id) as payment_state_count
            FROM 
                account_move
            WHERE 
                invoice_date >= %s
                AND invoice_date <= %s
                AND move_type = 'out_invoice'
            GROUP BY 
                payment_state
        """

        self.env.cr.execute(query, (start_date, end_date))
        results = self.env.cr.dictfetchall()

        # Format the results to match the original read_group structure
        formatted_results = []
        for record in results:
            formatted_results.append({
                'payment_state': record['payment_state'],
                'payment_state_count': record['payment_state_count']
            })

        return formatted_results