{
    'name': 'Sales Dashboard',
    'version': '17.0.1.0.0',
    'category': 'Sales',
    'summary': 'Dashboard for sales managers',
    'price': 24.99,
    'currency':'USD',
    'author': 'MD Muntasir Kamal',
    'company': '',
    'maintainer': 'MD Muntasir Kamal',
    'website': "https://github.com/muntasirbubt",
    'images': ['static/description/icon.png'],
    'depends': ['sale', 'account'],
    'data': [
        'views/sales_dashboard_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'sales_dashboard/static/src/css/sales_dashboard.css',
            'sales_dashboard/static/src/js/dashboard.js',
            'sales_dashboard/static/src/xml/dashboard.xml',
            '/web/static/lib/Chart/Chart.js',
        ],
    },
    'images': ['static/description/banner.png'],
    'installable': True,
    'application': True,
}