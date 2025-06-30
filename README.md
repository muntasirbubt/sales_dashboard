# Sales Dashboard for Odoo

A custom Odoo 17 Community module that provides a dynamic, interactive dashboard for sales managers to monitor key performance indicators such as top-performing salespersons, best-selling products, sales order statuses, payment summaries, and more.

---

## 📊 Features

- **Best Salespersons**
  - Shows top 5 salespersons based on number of confirmed sales orders.
  - Display includes salesperson name and total confirmed orders.

- **Best Selling Products**
  - Lists products most frequently sold in confirmed/done orders.
  - Includes product name and quantity delivered.

- **Sales Order Status Overview**
  - Provides real-time counts of orders in various stages:
    - Draft, Sent, Sale (Confirmed), Done, Cancelled

- **Payment Status Summary**
  - Displays payment distribution:
    - Paid, Due (not_paid), Partial

- **Payment Order Summary by Journal**
  - Groups and totals inbound payments (customer payments) by journal.
  - Helps identify revenue streams across different payment methods.

- **Date Range Filter**
  - Dynamic filtering of all data based on selected start and end date.
  - Defaults to last 1 year if no date is selected.

---

## 🛠️ Installation

1. Clone this repository into your Odoo `custome_modules` directory
   
