/** @odoo-module **/
import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class SalesDashboard extends Component {
    static template = "sales_dashboard.DashboardTemplate";

//    setup() {
//        this.rpc = useService("rpc");
//        this.state = useState({ data: {} });
//        onWillStart(() => this.loadData());
//    }
    setup() {
        this.rpc = useService("rpc");
        this.state = useState({
            startDate: null, // or default date string "2024-06-29"
            endDate: null,
            data: {}
        });
        onWillStart(() => this.loadData());
    }
    formatCurrency(amount) {
        // You can customize locale and currency here
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    async loadData() {
    let start = this.state.startDate;
    let end = this.state.endDate;

    if (!start || !end) {
        const today = new Date();
        end = today.toISOString().split('T')[0];
        const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
        start = lastYear.toISOString().split('T')[0];
    }

    const data = await this.rpc("/sales_dashboard/data", {
        start_date: start,
        end_date: end
    });

    this.state.data = data;
}
}

registry.category("actions").add("sales_dashboard_action", SalesDashboard);
export default SalesDashboard;
