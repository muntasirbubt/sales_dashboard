/** @odoo-module **/
import { Component, useState, onWillStart, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class SalesDashboard extends Component {
    static template = "sales_dashboard.DashboardTemplate";

    setup() {
        this.rpc = useService("rpc");
        this.state = useState({
            startDate: null,
            endDate: null,
            data: {
                best_selling_products: []
            }
        });
        this.canvasId = "best_products_graph"; // Chart canvas id
        onWillStart(() => this.loadData());
        onMounted(() => this.renderChart());   // chart after DOM ready
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    }

    async loadData() {
        let start = this.state.startDate;
        let end = this.state.endDate;

        if (!start || !end) {
            const today = new Date();
            end = today.toISOString().split("T")[0];
            const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
            start = lastYear.toISOString().split("T")[0];
        }

        const data = await this.rpc("/sales_dashboard/data", {
            start_date: start,
            end_date: end,
        });

        this.state.data = data;

        // render chart AFTER data loaded
        this.renderChart();
    }


    renderChart() {
        if (!this.state.data.best_selling_products) {
            return; // no data yet
        }

        const products = this.state.data.best_selling_products;
        const labels = products.map((p) => p.product_id[1]);
        const values = products.map((p) => p.qty_delivered);

        const ctx = document.getElementById(this.canvasId);
        if (!ctx) return;

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Quantity Delivered",
                        data: values,
                        backgroundColor: "rgba(54, 162, 235, 0.6)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
            },
        });
    }
}

registry.category("actions").add("sales_dashboard_action", SalesDashboard);
export default SalesDashboard;