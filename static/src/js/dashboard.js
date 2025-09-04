/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Component, useState, onWillStart, onMounted } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

// Use the global Chart object that should be available from the CDN
//const { Chart } = window;

class SalesDashboard extends Component {
    static template = "sales_dashboard.DashboardTemplate";

    setup() {
        this.rpc = useService("rpc");
        this.state = useState({
             windowHeight: window.innerHeight,
            windowWidth: window.innerWidth,
            startDate: null,
            endDate: null,
            data: {
                best_selling_products: [],
                best_salespersons: [],
                best_salespersons_by_confirm_order: [],
                status_overview: [],
                payment_order_summary: [],
                payment_summary: [],
                day_wise_sales: [],
                top_customers: [],
            },
        });

        this.resizeHandler = () => {
            this.state.windowHeight = window.innerHeight;
            this.state.windowWidth = window.innerWidth;
            this.renderCharts(); // Re-render charts on resize
        };
        window.addEventListener('resize', this.resizeHandler);


        // Store all chart instances
        this.charts = {
            bestProducts: null,
            bestSalespersonsHistogram: null,
            topSalespersonsBar: null,
            statusOverviewPie: null,
            paymentStatusDonut: null,
            dayWiseSales: null,
            topCustomersChart: null,
        };

        onWillStart(() => this.loadData());
        onMounted(() => {
            // Wait a bit to ensure DOM is fully rendered
            setTimeout(() => this.renderCharts(), 100);
        });
    }

    async loadData() {
        let start = this.state.startDate;
        let end = this.state.endDate;

        if (!start || !end) {
            const today = new Date();
            end = today.toISOString().split("T")[0];
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            start = lastMonth.toISOString().split("T")[0];

            this.state.startDate = start;
            this.state.endDate = end;
        }

        try {
            const data = await this.rpc("/sales_dashboard/data", {
                start_date: this.state.startDate,
                end_date: this.state.endDate,
            });

            this.state.data = data;
            this.renderCharts();
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }

    renderCharts() {
        requestAnimationFrame(() => {
            // Destroy all existing charts first
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });

            // Recreate all charts
            this.renderBestProductsChart();
            this.renderBestSalespersonsHistogram();
            this.renderTopSalespersonsBarChart();
            this.renderStatusOverviewPieChart();
            this.renderPaymentStatusDonutChart();
            this.renderDayWiseSalesChart();
            this.renderTopCustomersChart();

        });
    }


    // Clean up
    willUnmount() {
        window.removeEventListener('resize', this.resizeHandler);

        // Destroy all charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }

    renderTopCustomersChart() {
    const data = this.state.data.top_customers || [];
    if (data.length === 0) return;

    const ctx = document.getElementById('top_customers_chart');
    if (!ctx) return;

    if (this.charts.topCustomersChart) {
        this.charts.topCustomersChart.destroy();
    }

    const labels = data.map(item => item.partner_id[1]);
    const values = data.map(item => item.amount_total);

    this.charts.topCustomersChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales Amount',
                data: values,
                backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF"
                ],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Sales Amount ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Customers'
                    }
                }
            }
        }
    });
    }


    renderBestProductsChart() {
        if (!this.state.data.best_selling_products || this.state.data.best_selling_products.length === 0) return;

        const products = this.state.data.best_selling_products;
        const labels = products.map((p) => p.product_id[1]);
        const values = products.map((p) => p.qty_delivered);

        const ctx = document.getElementById('best_products_graph');
        if (!ctx) return;

        // Destroy previous chart if it exists
        if (this.charts.bestProducts) {
            this.charts.bestProducts.destroy();
        }

        this.charts.bestProducts = new Chart(ctx.getContext('2d'), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Quantity Delivered",
                        data: values,
                        // Pass an array of colors for each bar
                        backgroundColor: [
                            "#896C6C",
                            "#0D1164",
                            "#67C090",
                            "#33A1E0",
                            "#CADCAE",
                            "#1C352D"
                        ],
                        borderColor: [
                            "#896C6C",
                            "#0D1164",
                            "#67C090",
                            "#33A1E0",
                            "#CADCAE",
                            "#1C352D"
                        ],
                        borderWidth: 2,
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

    renderBestSalespersonsHistogram() {
        const data = this.state.data.best_salespersons || [];
        if (data.length === 0) return;

        const ctx = document.getElementById('best_salespersons_histogram');
        if (!ctx) return;

        if (this.charts.bestSalespersonsHistogram) {
            this.charts.bestSalespersonsHistogram.destroy();
        }

        const labels = data.map(item => item.user_id[1]);
        const values = data.map(item => item.amount_total);

        this.charts.bestSalespersonsHistogram = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales Amount',
                    data: values,
                    backgroundColor: [
                            "#154D71",
                            "#1C6EA4",
                            "#33A1E0",
                            "#3B38A0",
                            "#CADCAE",
                            "#B2B0E8"
                        ],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Sales Amount ($)'
                        }
                    }
                }
            }
        });
    }

    renderTopSalespersonsBarChart() {
        const data = this.state.data.best_salespersons_by_confirm_order || [];
        if (data.length === 0) return;

        const ctx = document.getElementById('top_salespersons_bar');
        if (!ctx) return;

        if (this.charts.topSalespersonsBar) {
            this.charts.topSalespersonsBar.destroy();
        }

        const labels = data.map(item => item.user_id[1]);
        const values = data.map(item => item.user_id_count);

        this.charts.topSalespersonsBar = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Orders',
                    data: values,
                    backgroundColor: [
                            "#3E3F29",
                            "#7D8D86",
                            "#BCA88D",
                            "#BCA88D",
                            "#F1F0E4",
                            "#DBE4C9"
                        ],
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Orders'
                        }
                    }
                }
            }
        });
    }

    renderStatusOverviewPieChart() {
        const data = this.state.data.status_overview || [];
        if (data.length === 0) return;

        const ctx = document.getElementById('status_overview_pie');
        if (!ctx) return;

        if (this.charts.statusOverviewPie) {
            this.charts.statusOverviewPie.destroy();
        }

        const labels = data.map(item => {
            switch(item.state) {
                case 'draft': return 'Draft';
                case 'sent': return 'RFQ Sent';
                case 'cancel': return 'Cancel';
                case 'sale': return 'Sale Order';
                default: return 'Draft';
            }
        });
        const values = data.map(item => item.state_count);
        const backgroundColors = [
                            "#e15759",
                            "#ff7f0e",
                            "#1f77b4",
                            "#d62728",
                            "#a6cee3",
                            "#DDDEAB"
                        ];

        this.charts.statusOverviewPie = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderPaymentStatusDonutChart() {
        const data = this.state.data.payment_summary || [];
        if (data.length === 0) return;

        const ctx = document.getElementById('payment_status_donut');
        if (!ctx) return;

        if (this.charts.paymentStatusDonut) {
            this.charts.paymentStatusDonut.destroy();
        }

        const labels = data.map(item => {
            switch(item.payment_state) {
                case 'not_paid': return 'Not Paid';
                case 'paid': return 'Paid';
                case 'in_payment': return 'In Payment';
                case 'partial': return 'Partially Paid';
                case 'reversed': return 'Reversed';
                case 'invoicing_legacy': return 'Invoicing App Legacy';
                default: return 'Unknown';
            }
        });
        const values = data.map(item => item.payment_state_count);
        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(153, 102, 255, 0.7)'
        ];

        this.charts.paymentStatusDonut = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderDayWiseSalesChart() {
    const data = this.state.data.day_wise_sales || [];
    const ctx = document.getElementById('day_wise_sales_chart');

    if (!ctx) return;

    if (this.charts.dayWiseSales) {
        this.charts.dayWiseSales.destroy();
    }

    // Handle empty data
    if (data.length === 0 || data.every(item => item.total_amount === 0)) {
        const noDataCtx = ctx.getContext('2d');
        noDataCtx.fillStyle = '#f8f9fa';
        noDataCtx.fillRect(0, 0, ctx.width, ctx.height);
        noDataCtx.fillStyle = '#6c757d';
        noDataCtx.font = '16px Arial';
        noDataCtx.textAlign = 'center';
        noDataCtx.fillText('No sales data available for selected period', ctx.width / 2, ctx.height / 2);
        return;
    }

    // Format dates and data
    const labels = data.map(item => {
        const date = new Date(item.sale_date);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    });

    const values = data.map(item => item.total_amount);

    this.charts.dayWiseSales = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Sales Amount',
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Sales: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Sales Amount ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    }

    formatCurrency(value) {
        if (value == null) return '';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    }
}

// Register the component
registry.category("actions").add("sales_dashboard_action", SalesDashboard);

export default SalesDashboard;